import { apiClient } from '../client';
import { patientService } from './patient';
import { appointmentService } from './appointment';
import { prescriptionService } from './prescription';
import { paymentService } from './payment';
import { fileUploadService } from './fileUpload';
import { orthodonticService } from './orthodontic';
import { dentalChartService } from './dentalChart';
import { practitionerService } from './practitioner';
import { clinicProfileService } from './clinicProfile';
import { PatientSummaryPrintData, CaseDiaryEntry, BillingEntry } from '../../utils/patientSummaryTemplates';
import { ClinicProfile } from './clinicProfile';

interface PreloadedPatientSummaryData {
  patient?: any;
  prescriptions?: any[];
  invoices?: any[];
  paymentSummary?: any;
  patientFiles?: any[];
  appointments?: any[];
  clinicalRecords?: any[];
}

const fetchClinicalRecordsForPatient = async (patientId: string): Promise<any[]> => {
  // Prefer the same endpoint used in PrescriptionPage for consistency.
  try {
    const res = await apiClient.get<any>(
      `/api/method/mob_clinic.mob_clinic.api.clinical_record.get_clinical_records?patient_id=${encodeURIComponent(patientId)}`
    );
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.message?.data)) return data.message.data;
  } catch {
    // fallback below
  }

  // Fallback to direct doctype query.
  try {
    const clinicalRecordFilters = encodeURIComponent(JSON.stringify([["patient", "=", patientId]]));
    const clinicalRecordFields = encodeURIComponent(JSON.stringify(["*"]));
    const res = await (apiClient.get(
      `/api/resource/Clinical Record?filters=${clinicalRecordFilters}&fields=${clinicalRecordFields}`
    ) as Promise<any>);
    return res?.data?.data || [];
  } catch {
    return [];
  }
};

const toDateKey = (value: string | Date | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateKey = (dateKey: string): string => {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString('en-IN');
};

const parseMedicalHistory = (raw: unknown): Record<string, any> => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, any>) : {};
};

const normalizeBloodGroup = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const normalized = raw.toUpperCase().replace(/\s+/g, '');

  const knownMap: Record<string, string> = {
    APOSITIVE: 'A+',
    ANEGATIVE: 'A-',
    BPOSITIVE: 'B+',
    BNEGATIVE: 'B-',
    OPOSITIVE: 'O+',
    ONEGATIVE: 'O-',
    ABPOSITIVE: 'AB+',
    ABNEGATIVE: 'AB-',
  };

  if (knownMap[normalized]) return knownMap[normalized];
  return raw;
};

const normalizeDoctorName = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const name = String(value).trim();
  if (!name) return undefined;

  // Ignore user IDs/emails in doctor display unless mapped to a practitioner name.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(name)) return undefined;

  const lowered = name.toLowerCase();
  if (lowered === 'administrator' || lowered === 'guest') return undefined;
  return name;
};

const buildPractitionerLookup = (practitioners: any[]): Map<string, string> => {
  const lookup = new Map<string, string>();
  (practitioners || []).forEach((p: any) => {
    const displayName = normalizeDoctorName(p?.practitioner_name);
    if (!displayName) return;

    [
      p?.name,
      p?.email,
      p?.practitioner_name,
      p?.user_id,
      p?.user,
      p?.user_email,
      p?.owner,
    ].forEach((candidate) => {
      if (!candidate) return;
      lookup.set(String(candidate).trim().toLowerCase(), displayName);
    });
  });
  return lookup;
};

const resolveDoctorName = (value: unknown, practitionerLookup: Map<string, string>): string | undefined => {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;

  const mapped = practitionerLookup.get(raw.toLowerCase());
  if (mapped) return mapped;

  return normalizeDoctorName(raw);
};

const getProcedureDoctorCandidate = (proc: any): string | undefined => {
  const candidates = [
    proc?.practitioner_name,
    proc?.practitioner,
    proc?.doctor_name,
    proc?.doctor,
    proc?.created_by_name,
    proc?.owner_name,
    proc?.modified_by_name,
    proc?.created_by,
    proc?.owner,
    proc?.modified_by,
  ];

  for (const candidate of candidates) {
    if (candidate && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }
  return undefined;
};

const normalizePaymentType = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const v = String(value).trim();
  return v || undefined;
};

const extractPaymentTypeFromInvoice = (invoiceLike: any): string | undefined => {
  const direct =
    normalizePaymentType(invoiceLike?.mode_of_payment) ||
    normalizePaymentType(invoiceLike?.payment_mode) ||
    normalizePaymentType(invoiceLike?.payment_method) ||
    normalizePaymentType(invoiceLike?.payment_type);
  if (direct) return direct;

  const payments = Array.isArray(invoiceLike?.payments) ? invoiceLike.payments : [];
  for (const payment of payments) {
    const mode =
      normalizePaymentType(payment?.mode_of_payment) ||
      normalizePaymentType(payment?.payment_mode) ||
      normalizePaymentType(payment?.payment_method) ||
      normalizePaymentType(payment?.payment_type);
    if (mode) return mode;
  }
  return undefined;
};


export class PatientSummaryService {
  async getPatientSummaryData(
    patientId: string, 
    clinicId?: string,
    clinicProfile?: ClinicProfile | null,
    preloadedData?: PreloadedPatientSummaryData
  ): Promise<PatientSummaryPrintData> {
    try {
      // 1. Use preloaded data when available; fetch only missing pieces.

      const [
        patient, 
        prescriptions, 
        invoices, 
        paymentSummary, 
        patientFiles, 
        allAppointments,
        orthoResponse,
        dentalChart,
        clinicalRecords,
        practitioners
      ] = await Promise.all([
        preloadedData?.patient !== undefined
          ? Promise.resolve(preloadedData.patient)
          : patientService.getPatient(patientId),
        preloadedData?.prescriptions !== undefined
          ? Promise.resolve(preloadedData.prescriptions)
          : prescriptionService.getPatientPrescriptions(patientId),
        preloadedData?.invoices !== undefined
          ? Promise.resolve(preloadedData.invoices)
          : paymentService.getInvoices({ limit_page_length: 50 }, { patient_id: patientId }).then(r => r.data),
        preloadedData?.paymentSummary !== undefined
          ? Promise.resolve(preloadedData.paymentSummary)
          : paymentService.getPaymentSummary(patientId),
        preloadedData?.patientFiles !== undefined
          ? Promise.resolve(preloadedData.patientFiles)
          : fileUploadService.getPatientFiles(patientId),
        preloadedData?.appointments !== undefined
          ? Promise.resolve(preloadedData.appointments)
          : appointmentService.getPatientAppointments(patientId, 50),
        orthodonticService.getPatientSummary(patientId, clinicId).catch(() => null),
        dentalChartService.getDentalChart(patientId).catch(() => null),
        preloadedData?.clinicalRecords !== undefined
          ? Promise.resolve(preloadedData.clinicalRecords)
          : fetchClinicalRecordsForPatient(patientId),
        practitionerService.getPractitioners().then((res: any) => res?.data || []).catch(() => [])
      ]);
      const practitionerLookup = buildPractitionerLookup(practitioners as any[]);

      const mh = parseMedicalHistory((patient as any)?.medical_history);
      const familyHistory = mh.family_medical_history;
      const vaccinationStatus = mh.vaccination_status;
      const existingConditions = Object.keys(mh).filter(k => mh[k] === true && k !== 'nrmh');
      const allergies = mh.allergies ? (typeof mh.allergies === 'string' ? mh.allergies.split(',').map((s: string) => s.trim()) : []) : [];

      // 4. Consolidate Case Diary (Grouped by Date)
      const diaryMap: Record<string, CaseDiaryEntry & { sortDateKey: string }> = {};
      const procedureDoctorByDate: Record<string, string> = {};

      const getOrCreateEntry = (dateKey: string): CaseDiaryEntry & { sortDateKey: string } => {
        if (!diaryMap[dateKey]) {
          diaryMap[dateKey] = {
            visit_date: formatDateKey(dateKey),
            sortDateKey: dateKey,
            procedures: [],
            clinical_notes: '',
            diagnosis: '',
          };
        }
        return diaryMap[dateKey];
      };

      // A. Add Appointments (for Reason for visit)
      (allAppointments || []).forEach((apt: any) => {
        const dateKey = toDateKey(apt.appointment_datetime || apt.appointment_date);
        if (!dateKey) return;
        const entry = getOrCreateEntry(dateKey);
        
        if (apt.chief_complaint && !entry.reason_for_visit) {
          entry.reason_for_visit = apt.chief_complaint;
        }
        const appointmentDoctor = resolveDoctorName(apt.practitioner_name || apt.practitioner, practitionerLookup);
        if (appointmentDoctor && !entry.doctor_name) {
          entry.doctor_name = appointmentDoctor;
        }
      });

      // B. Add Prescriptions
      (prescriptions || []).forEach((p: any) => {
        const dateKey = toDateKey(p.encounter_date || p.posting_date || p.creation);
        if (!dateKey) return;
        const entry = getOrCreateEntry(dateKey);
        
        if (p.chief_complaint && !entry.reason_for_visit) entry.reason_for_visit = p.chief_complaint;
        if (p.diagnosis) entry.diagnosis = (entry.diagnosis ? entry.diagnosis + '; ' : '') + p.diagnosis;
        if (p.treatment_plan) {
          entry.clinical_notes = (entry.clinical_notes ? entry.clinical_notes + '\n' : '') + p.treatment_plan;
        }
        const prescriptionDoctor = resolveDoctorName(p.practitioner_name || p.practitioner, practitionerLookup);
        if (prescriptionDoctor) entry.doctor_name = prescriptionDoctor;
        
        // Add medicines as procedures
        if (p.medications?.length) {
          p.medications.forEach((m: any) => {
            const mName = m.drug_name || m.medicine_name;
            if (mName && !entry.procedures?.includes(mName)) {
              entry.procedures?.push(mName);
            }
          });
        }
      });

      // C. Add Dental Chart Procedures (Grouped by Date then Procedure Name for Combining Teeth)
      if (dentalChart?.teeth) {
        const tempProceduresMap: Record<string, Record<string, number[]>> = {}; // Date -> ProcedureName -> ToothNumbers[]

        Object.values(dentalChart.teeth).forEach((tooth: any) => {
          const toothNum = tooth.tooth_number;
          
          (tooth.procedures || []).forEach((proc: any) => {
            const dateStr = toDateKey(proc.date || proc.creation);
            if (!dateStr) return;
            const pName = proc.procedure_name || proc.name;
            if (!pName) return;

            if (!tempProceduresMap[dateStr]) tempProceduresMap[dateStr] = {};
            if (!tempProceduresMap[dateStr][pName]) tempProceduresMap[dateStr][pName] = [];
            
            if (toothNum && !tempProceduresMap[dateStr][pName].includes(toothNum)) {
              tempProceduresMap[dateStr][pName].push(toothNum);
            }

            const entry = getOrCreateEntry(dateStr);
            if (proc.notes) {
              entry.clinical_notes = (entry.clinical_notes ? entry.clinical_notes + '\n' : '') + `Tooth ${toothNum}: ${proc.notes}`;
            }
            const procDoctor = resolveDoctorName(getProcedureDoctorCandidate(proc), practitionerLookup);
            if (procDoctor && !procedureDoctorByDate[dateStr]) {
              procedureDoctorByDate[dateStr] = procDoctor;
            }
            if (procDoctor && !entry.doctor_name) {
              entry.doctor_name = procDoctor;
            }
          });

          (tooth.conditions || []).forEach((cond: any) => {
             const dateStr = toDateKey(cond.date || cond.creation);
             if (!dateStr) return;
             const cType = cond.type;
             if (!cType) return;

             if (!tempProceduresMap[dateStr]) tempProceduresMap[dateStr] = {};
             if (!tempProceduresMap[dateStr][cType]) tempProceduresMap[dateStr][cType] = [];
             
             if (toothNum && !tempProceduresMap[dateStr][cType].includes(toothNum)) {
               tempProceduresMap[dateStr][cType].push(toothNum);
             }
          });
        });

        // Convert tempProceduresMap back to the flat procedure tags with combined tooth numbers
        Object.entries(tempProceduresMap).forEach(([dateStr, procs]) => {
          const entry = getOrCreateEntry(dateStr);
          Object.entries(procs).forEach(([pName, teeth]) => {
            const combinedToothStr = teeth.length > 0 ? ` (Tooth ${teeth.sort((a,b)=>a-b).join(', ')})` : '';
            const fullLabel = pName + combinedToothStr;
            
            if (!entry.procedures?.includes(fullLabel)) {
              entry.procedures?.push(fullLabel);
            }
          });
        });
      }

      // D. Add Clinical Records
      (clinicalRecords as any[]).forEach(cr => {
        const dateKey = toDateKey(cr.record_date || cr.creation);
        if (!dateKey) return;
        const entry = getOrCreateEntry(dateKey);
        
        if (cr.notes) {
          entry.clinical_notes = (entry.clinical_notes ? entry.clinical_notes + '\n' : '') + cr.notes;
        }
        if (cr.diagnosis) {
          entry.diagnosis = (entry.diagnosis ? entry.diagnosis + '; ' : '') + cr.diagnosis;
        }
        const clinicalDoctor = resolveDoctorName(cr.practitioner_name || cr.practitioner, practitionerLookup);
        if (clinicalDoctor && !entry.doctor_name) entry.doctor_name = clinicalDoctor;
      });

      // E. Link Invoices
      (invoices as any[] || []).forEach(inv => {
        const dateKey = toDateKey(inv.posting_date);
        if (!dateKey) return;
        const entry = getOrCreateEntry(dateKey);
        
        if (!entry.invoice_id || inv.grand_total > (entry.invoice_amount || 0)) {
          entry.invoice_id = inv.name || inv.invoice_id;
          entry.invoice_amount = inv.grand_total;
          entry.payment_status = inv.status === 'Paid' ? 'Paid' : (inv.outstanding_amount === 0 ? 'Paid' : (inv.outstanding_amount === inv.grand_total ? 'Unpaid' : 'Partially Paid'));
        }

        const invoiceDoctor = resolveDoctorName(
          inv.practitioner_name ||
          inv.healthcare_practitioner ||
          inv.doctor_name ||
          inv.doctor,
          practitionerLookup
        );
        if (invoiceDoctor && !entry.doctor_name) {
          entry.doctor_name = invoiceDoctor;
        }
      });

      // F. Doctor fallback from procedure creator/doctor when appointment/invoice mapping is unavailable.
      Object.entries(diaryMap).forEach(([dateKey, entry]) => {
        if (!entry.doctor_name && procedureDoctorByDate[dateKey]) {
          entry.doctor_name = procedureDoctorByDate[dateKey];
        }
      });

      // G. Final fallback: hydrate missing-doctor entries from full invoice details.
      const invoiceIdsForMissingDoctor = Array.from(
        new Set(
          Object.values(diaryMap)
            .filter((entry) => !entry.doctor_name && entry.invoice_id)
            .map((entry) => entry.invoice_id as string)
        )
      );

      if (invoiceIdsForMissingDoctor.length > 0) {
        const invoiceDetailResults = await Promise.all(
          invoiceIdsForMissingDoctor.map(async (invoiceId) => {
            try {
              const details = await paymentService.getInvoice(invoiceId);
              return { invoiceId, details };
            } catch {
              return { invoiceId, details: null };
            }
          })
        );

        const invoiceDoctorById = new Map<string, string>();
        invoiceDetailResults.forEach(({ invoiceId, details }) => {
          if (!details) return;
          const resolved = resolveDoctorName(
            (details as any).practitioner_name ||
            (details as any).healthcare_practitioner ||
            (details as any).doctor_name ||
            (details as any).doctor ||
            (details as any).owner ||
            (details as any).modified_by,
            practitionerLookup
          );
          if (resolved) {
            invoiceDoctorById.set(invoiceId, resolved);
          }
        });

        Object.values(diaryMap).forEach((entry) => {
          if (!entry.doctor_name && entry.invoice_id) {
            const mapped = invoiceDoctorById.get(entry.invoice_id);
            if (mapped) {
              entry.doctor_name = mapped;
            }
          }
        });
      }

      const diary = Object.values(diaryMap)
        .sort((a, b) => b.sortDateKey.localeCompare(a.sortDateKey))
        .map(({ sortDateKey: _sortDateKey, ...item }) => ({
          ...item,
          clinical_notes: item.clinical_notes?.trim() || undefined,
          diagnosis: item.diagnosis?.trim() || undefined,
          reason_for_visit: item.reason_for_visit?.trim() || undefined,
        }))
        .slice(0, 15);

      // 5. Billing Entries
      const billingInvoices = (invoices as any[] || []).slice(0, 10);
      const invoicesNeedingPaymentType = billingInvoices.filter((inv: any) => {
        const existing = extractPaymentTypeFromInvoice(inv);
        const paidAmount = Number(inv?.paid_amount || 0);
        return !existing && paidAmount > 0;
      });

      const invoicePaymentTypeLookup = new Map<string, string>();
      if (invoicesNeedingPaymentType.length > 0) {
        const detailResults = await Promise.all(
          invoicesNeedingPaymentType.map(async (inv: any) => {
            const invoiceId = inv?.name || inv?.invoice_id;
            if (!invoiceId) return null;
            try {
              const details = await paymentService.getInvoice(invoiceId);
              const mode = extractPaymentTypeFromInvoice(details);
              if (mode) {
                return { invoiceId, mode };
              }
            } catch {
              // Keep silent and fall back to '--'
            }
            return null;
          })
        );

        detailResults.forEach((row) => {
          if (row?.invoiceId && row?.mode) {
            invoicePaymentTypeLookup.set(row.invoiceId, row.mode);
          }
        });
      }

      const billingEntries: BillingEntry[] = billingInvoices.map((inv: any) => {
        const invoiceId = inv?.name || inv?.invoice_id;
        const inlineMode = extractPaymentTypeFromInvoice(inv);
        const detailMode = invoiceId ? invoicePaymentTypeLookup.get(invoiceId) : undefined;
        return {
          date: new Date(inv.posting_date).toLocaleDateString('en-IN'),
          description: inv.name || 'Treatment',
          payment_type: inlineMode || detailMode || '--',
          amount: inv.grand_total,
        };
      });

      const totalInvoiced = paymentSummary?.total_invoiced || 0;
      const totalPaid = paymentSummary?.total_paid || 0;
      const totalDue = paymentSummary?.outstanding_amount || 0;

      let clinicLogo: string | undefined;
      const rawClinicLogo = clinicProfile?.basic_info?.logo_url;
      if (rawClinicLogo) {
        if (rawClinicLogo.startsWith('data:')) {
          clinicLogo = rawClinicLogo;
        } else {
          try {
            const embedded = await clinicProfileService.getEmbeddedAsset(rawClinicLogo);
            clinicLogo = embedded?.data_url || undefined;
          } catch {
            clinicLogo = rawClinicLogo.startsWith('http')
              ? rawClinicLogo
              : `${process.env.REACT_APP_API_BASE_URL || 'http://dev2.localhost:8800'}${rawClinicLogo}`;
          }
        }
      }

      // Determine header doctor based on patient record or most recent activity
      const headerDoctor = resolveDoctorName(
        (patient as any)?.practitioner_name ||
        (patient as any)?.practitioner ||
        (allAppointments && allAppointments.length > 0 ? (allAppointments[0].practitioner_name || allAppointments[0].practitioner) : null) ||
        (invoices && invoices.length > 0 ? ((invoices[0] as any).practitioner_name || (invoices[0] as any).healthcare_practitioner) : null),
        practitionerLookup
      );

      return {
        clinicName: clinicProfile?.basic_info?.clinic_name || 'Clinic',
        clinicAddress: clinicProfile?.address ? 
          `${clinicProfile.address.address_line1 || ''}${clinicProfile.address.address_line2 ? ', ' + clinicProfile.address.address_line2 : ''}, ${clinicProfile.address.city || ''}, ${clinicProfile.address.state || ''} ${clinicProfile.address.pincode || ''}`.trim().replace(/^,|,$/g, '') : 
          undefined,
        clinicPhone: clinicProfile?.basic_info?.phone,
        clinicEmail: clinicProfile?.basic_info?.email,
        clinicLogo: clinicLogo,
        doctorName: headerDoctor || '',
        doctorQualification: '', // Removed generic specialization as requested
        generatedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),

        patientName: patient?.patient_name || 
                     ((patient as any)?.first_name ? `${(patient as any).first_name} ${(patient as any).last_name || ''}`.trim() : '') || 
                     (patient as any)?.full_name || 
                     'Patient',
        patientId: (patient as any)?.patient_id || patient?.name || '',
        dob: patient?.dob,
        age: patient?.dob ? 
          String(Math.floor((new Date().getTime() - new Date(patient.dob).getTime()) / 31536000000)) : 
          undefined,
        bloodGroup: normalizeBloodGroup(
          (patient as any)?.blood_group ||
          (patient as any)?.blood_type ||
          mh?.blood_group ||
          mh?.blood_type
        ),
        gender: (patient as any)?.sex,
        
        bloodPressure: mh?.blood_pressure,
        medicalSummary: mh?.other || (mh?.nrmh ? 'NRMH' : undefined),
        existingConditions: existingConditions,
        allergies: allergies,
        familyHistory: familyHistory,
        vaccinationStatus: vaccinationStatus,

        caseDiary: diary,
        recordImages: (patientFiles || [])
          .filter((f: any) => f?.is_image && f?.file_url)
          .map((f: any) => ({
          url: f.file_url.startsWith('http') ? f.file_url : `${process.env.REACT_APP_API_BASE_URL || 'http://dev2.localhost:8800'}${f.file_url}`,
          label: f.file_name,
          date: new Date(f.creation).toLocaleDateString('en-IN')
        })),
        
        orthodontic: orthoResponse ? {
          case_type: orthoResponse.case_type || 'Active',
          estimated_duration: orthoResponse.estimated_duration_months ? `${orthoResponse.estimated_duration_months} Months` : undefined,
          package_cost: orthoResponse.package_fee || 0,
          advance_paid: orthoResponse.advance_paid || 0,
          remaining_balance: orthoResponse.balance_amount || 0,
          ledger: (orthoResponse.recent_ledger || []).map((l: any) => ({
            visit_date: new Date(l.visit_date || l.date || '').toLocaleDateString('en-IN'),
            payment: l.payment_amount,
            balance: l.balance_after_entry || l.remaining_balance,
            notes: l.visit_notes || l.notes,
            next_appt: l.next_appointment_date
          }))
        } : undefined,

        billing: {
          entries: billingEntries,
          totalInvoiced: totalInvoiced,
          totalPaid: totalPaid,
          totalDue: totalDue,
        },
        
        nextAppointment: allAppointments?.[0] ? (() => {
               const rawStart = allAppointments[0].appointment_datetime || allAppointments[0].appointment_date || '';
               const startDate = new Date(rawStart);
               const hasValidStart = !Number.isNaN(startDate.getTime());
               const endDate = hasValidStart ? new Date(startDate.getTime() + 30 * 60 * 1000) : null;
               return {
                 date: hasValidStart ? startDate.toLocaleDateString('en-IN') : '',
                 time: allAppointments[0].appointment_time || (hasValidStart ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
                 location: allAppointments[0].location || clinicProfile?.basic_info?.clinic_name || 'Clinic',
                 startIso: hasValidStart ? startDate.toISOString() : undefined,
                 endIso: endDate ? endDate.toISOString() : undefined,
               };
             })() : undefined
      };
    } catch (error) {
           console.error('Error in PatientSummaryService:', error);
           throw error;
    }
  }
}

export const patientSummaryService = new PatientSummaryService();
