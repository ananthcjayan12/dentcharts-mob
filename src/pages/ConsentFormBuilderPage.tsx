import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Sidebar } from '../components';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { consentFormService } from '../api/services/consentForm';
import { dentalChartService, patientService, prescriptionService } from '../api/services';
import { conditionsService } from '../api/services/conditions';
import { proceduresService } from '../api/services/procedures';
import { ConsentTemplate } from '../api/types';
import { generatePdfBlobFromElementWithRepeatedFooter, generatePdfBlobFromHtml } from '../utils/printUtils';
import {
  dedupeRepeatedParagraphs,
  escapeHtml,
  hydrateConsentSections,
  replaceConsentPlaceholders,
  renderSectionHtml,
} from '../utils/consentForm';

interface ConditionProcedureRow {
  id: string;
  toothNumber: string;
  condition: string;
  procedure: string;
}

interface MedicalHistorySummaryItem {
  label: string;
  value: string;
}

const anesthesiaPresets = ['Local', 'Topical', 'IV Sedation', 'Nitrous Oxide', 'General'];
const toothNumberPresets = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
  '55', '54', '53', '52', '51',
  '61', '62', '63', '64', '65',
  '85', '84', '83', '82', '81',
  '71', '72', '73', '74', '75',
];

const normalizeSpace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const titleCase = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const toDisplayName = (value: string): string => titleCase(value.replace(/[_-]+/g, ' ').trim());

const uniqueStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const unique: string[] = [];
  values.forEach((entry) => {
    const normalized = normalizeSpace(entry);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(normalized);
    }
  });
  return unique;
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',', 2)[1] : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read PDF blob'));
    reader.readAsDataURL(blob);
  });

const notifyConsentSaved = (patientId: string, consentTypeId: string) => {
  if (!patientId) return;

  const payload = {
    type: 'mob_clinic:consent-saved',
    patientId,
    consentTypeId,
    timestamp: Date.now(),
  };

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(payload, window.location.origin);
  }
};

const ConsentFormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, clinicId } = useClinic();

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const patientQuery = queryParams.get('patientId') || '';
  const embedMode = queryParams.get('embed') === '1';
  const returnTo = queryParams.get('returnTo') || '';
  const lockedPatientContext = Boolean(patientQuery);

  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const [consentTypeId, setConsentTypeId] = useState('');
  const [language, setLanguage] = useState<'en' | 'ml'>('en');

  const [patientId, setPatientId] = useState(patientQuery);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [mobilePanel, setMobilePanel] = useState<'builder' | 'preview'>('builder');

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [associatedComplaint, setAssociatedComplaint] = useState('');
  const [rows, setRows] = useState<ConditionProcedureRow[]>([{ id: crypto.randomUUID(), toothNumber: '', condition: '', procedure: '' }]);
  const [conditionOptions, setConditionOptions] = useState<string[]>([]);
  const [procedureOptions, setProcedureOptions] = useState<string[]>([]);
  const [conditionTypeMap, setConditionTypeMap] = useState<Record<string, string>>({});
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [anesthesiaTags, setAnesthesiaTags] = useState<string[]>([]);
  const [anesthesiaInput, setAnesthesiaInput] = useState('');

  const [minorMode, setMinorMode] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [medicalHistory, setMedicalHistory] = useState<Record<string, any>>({});

  const [summaryText, setSummaryText] = useState('');
  const [summaryEdited, setSummaryEdited] = useState(false);

  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [isSavingConsent, setIsSavingConsent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRootRef = useRef<HTMLDivElement | null>(null);
  const prefilledPatientRef = useRef<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const clinicDisplayName = profile?.basic_info?.clinic_name || clinicId || 'Clinic';

  const doctorName = useMemo(() => {
    const direct = user?.full_name || user?.name || 'Doctor';
    return direct.trim() || 'Doctor';
  }, [user]);

  const buildRowsFromChart = useCallback((chartResponse: any): ConditionProcedureRow[] => {
    const chart = chartResponse?.teeth
      ? chartResponse
      : (chartResponse?.data?.teeth ? chartResponse.data : null);

    if (!chart?.teeth || typeof chart.teeth !== 'object') {
      return [];
    }

    const extractedPairs: Array<{ toothNumber: string; condition: string; procedure: string }> = [];
    Object.entries(chart.teeth).forEach(([toothNumber, toothEntry]: [string, any]) => {
      const conditionsForTooth = (toothEntry?.conditions || [])
        .map((condition: any) => {
          const rawType = String(condition?.type || '').trim();
          if (!rawType) return '';
          return conditionTypeMap[rawType] || toDisplayName(rawType);
        })
        .filter(Boolean);

      const proceduresForTooth = (toothEntry?.procedures || [])
        .map((procedure: any) => String(procedure?.procedure_name || procedure?.name_of_procedure || '').trim())
        .filter(Boolean);

      const maxRows = Math.max(conditionsForTooth.length, proceduresForTooth.length);
      for (let idx = 0; idx < maxRows; idx += 1) {
        extractedPairs.push({
          toothNumber: String(toothNumber || '').trim(),
          condition: conditionsForTooth[idx] || conditionsForTooth[0] || '',
          procedure: proceduresForTooth[idx] || proceduresForTooth[0] || '',
        });
      }
    });

    const unique = new Map<string, { toothNumber: string; condition: string; procedure: string }>();
    extractedPairs.forEach((entry) => {
      const key = `${normalizeSpace(entry.toothNumber).toLowerCase()}::${normalizeSpace(entry.condition).toLowerCase()}::${normalizeSpace(entry.procedure).toLowerCase()}`;
      if (!unique.has(key)) {
        unique.set(key, {
          toothNumber: normalizeSpace(entry.toothNumber),
          condition: normalizeSpace(entry.condition),
          procedure: normalizeSpace(entry.procedure),
        });
      }
    });

    return Array.from(unique.values())
      .filter((entry) => entry.condition || entry.procedure)
      .map((entry) => ({ id: crypto.randomUUID(), ...entry }));
  }, [conditionTypeMap]);

  useEffect(() => {
    const run = async () => {
      setIsLoadingTemplates(true);
      try {
        const response = await consentFormService.getConsentTemplates();
        const rowsData = response.templates || [];
        setTemplates(rowsData);

        if (!consentTypeId && rowsData.length > 0) {
          setConsentTypeId(rowsData[0].consent_type_id);
        }
      } catch (error: any) {
        console.error('Failed to load consent templates', error);
        toast.error(error?.message || 'Failed to load consent templates');
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    run();
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadCatalogs = async () => {
      if (!clinicId) {
        setConditionOptions([]);
        setProcedureOptions([]);
        setConditionTypeMap({});
        return;
      }

      setIsLoadingCatalogs(true);
      try {
        const consentCutoff = issueDate ? new Date(`${issueDate}T23:59:59`) : null;
        const [conditionRows, procedureRows] = await Promise.all([
          conditionsService.getConditions(clinicId).catch(() => []),
          proceduresService.getProcedures(clinicId).catch(() => []),
        ]);

        const withinCutoff = (row: any) => {
          if (!consentCutoff || !row?.creation) return true;
          const createdAt = new Date(row.creation);
          return !Number.isNaN(createdAt.getTime()) && createdAt.getTime() <= consentCutoff.getTime();
        };

        const activeConditions = (conditionRows || []).filter((row: any) => row?.is_active !== false && withinCutoff(row));
        const activeProcedures = (procedureRows || []).filter((row: any) => row?.is_active !== false && withinCutoff(row));

        const conditionMap: Record<string, string> = {};
        activeConditions.forEach((row: any) => {
          if (row?.type && row?.condition_name) {
            conditionMap[String(row.type).trim()] = String(row.condition_name).trim();
          }
        });

        setConditionTypeMap(conditionMap);
        setConditionOptions(uniqueStrings(activeConditions.map((row: any) => String(row?.condition_name || '').trim())));
        setProcedureOptions(uniqueStrings(activeProcedures.map((row: any) => String(row?.procedure_name || '').trim())));
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, [clinicId, issueDate]);

  useEffect(() => {
    const loadPatientContext = async () => {
      if (!patientId) {
        prefilledPatientRef.current = '';
        return;
      }

      try {
        const [patientResponse, chartResponse, latestPrescriptions] = await Promise.all([
          patientService.getPatient(patientId),
          dentalChartService.getDentalChart(patientId).catch(() => null),
          prescriptionService.getRecentPrescriptions(patientId, 1).catch(() => []),
        ]);

        setPatientName(patientResponse.patient_name || patientResponse.name || '');
        setPatientAge(patientResponse.age !== null && patientResponse.age !== undefined ? String(patientResponse.age) : '');
        setPatientGender(patientResponse.sex || '');
        setPatientPhone(patientResponse.mobile || '');
        setMedicalHistory(
          (() => {
            try {
              const raw = (patientResponse as any)?.medical_history;
              if (!raw) return {};
              return typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch {
              return {};
            }
          })()
        );

        if (prefilledPatientRef.current !== patientId) {
          const prefilledRows = buildRowsFromChart(chartResponse);
          if (prefilledRows.length) {
            setRows(prefilledRows);
          } else {
            setRows([{ id: crypto.randomUUID(), toothNumber: '', condition: '', procedure: '' }]);
          }
          prefilledPatientRef.current = patientId;
        }

        const latestPrescription = Array.isArray(latestPrescriptions) ? latestPrescriptions[0] : null;
        if (latestPrescription) {
          setChiefComplaint((prev) => prev || latestPrescription.chief_complaint || latestPrescription.symptoms || '');
          setDiagnosis((prev) => prev || latestPrescription.diagnosis || '');
          setTreatmentPlan((prev) => prev || latestPrescription.treatment_plan || '');
        }
      } catch {
        // keep manual mode when patient id is free typed
      }
    };

    loadPatientContext();
  }, [patientId, buildRowsFromChart]);

  const consentTypes = useMemo(() => {
    const seen = new Map<string, string>();
    templates.forEach((item) => {
      if (!seen.has(item.consent_type_id)) {
        seen.set(item.consent_type_id, item.consent_type_label || item.consent_type_id);
      }
    });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    if (!consentTypeId) return null;

    const exact = templates.find((item) => item.consent_type_id === consentTypeId && item.language === language);
    if (exact) return exact;

    return templates.find((item) => item.consent_type_id === consentTypeId && item.language === 'en') || null;
  }, [templates, consentTypeId, language]);

  const consentSummaryHeading = useMemo(() => {
    if (!consentTypeId || !selectedTemplate) return 'Consent Summary';
    return selectedTemplate.consent_type_label || 'Consent Summary';
  }, [consentTypeId, selectedTemplate]);

  useEffect(() => {
    if (!selectedTemplate) return;
    if (!summaryEdited) {
      setSummaryText(selectedTemplate.summary_text || '');
    }
  }, [selectedTemplate, summaryEdited]);

  useEffect(() => {
    if (consentTypeId === 'pediatric') {
      setMinorMode(true);
    }
  }, [consentTypeId]);

  const conditionList = useMemo(
    () => uniqueStrings(rows.map((row) => row.condition)),
    [rows]
  );
  const procedureList = useMemo(
    () => uniqueStrings(rows.map((row) => row.procedure)),
    [rows]
  );
  const teethList = useMemo(
    () => uniqueStrings(rows.map((row) => row.toothNumber)),
    [rows]
  );
  const anesthesiaText = anesthesiaTags.join(', ');

  const medicalHistoryItems = useMemo<MedicalHistorySummaryItem[]>(() => {
    if (!medicalHistory || typeof medicalHistory !== 'object') {
      return [];
    }

    const preferredOrder = [
      'nrmh',
      'diabetic',
      'cardiac_history',
      'allergies',
      'family_heart_disease',
      'covid_vaccinated',
      'blood_pressure',
    ];

    const orderedKeys = [
      ...preferredOrder.filter((key) => key in medicalHistory),
      ...Object.keys(medicalHistory).filter((key) => !preferredOrder.includes(key)),
    ];

    return orderedKeys
      .filter((key) => medicalHistory[key] !== null && medicalHistory[key] !== undefined && medicalHistory[key] !== '' && medicalHistory[key] !== false)
      .map((key) => ({
        label: toDisplayName(key),
        value: typeof medicalHistory[key] === 'boolean' ? 'Yes' : String(medicalHistory[key]),
      }));
  }, [medicalHistory]);

  const toothOptions = useMemo(
    () => uniqueStrings([...toothNumberPresets, ...teethList]),
    [teethList]
  );

  const placeholderContext = useMemo(
    () => ({
      doctor: doctorName,
      procedure: procedureList.join(', '),
      condition: conditionList.join(', '),
      anesthesia: anesthesiaText,
    }),
    [doctorName, procedureList, conditionList, anesthesiaText]
  );

  const hydratedSections = useMemo(
    () => hydrateConsentSections(selectedTemplate?.sections || [], placeholderContext),
    [selectedTemplate, placeholderContext]
  );

  const renderedSummaryText = useMemo(
    () => dedupeRepeatedParagraphs(replaceConsentPlaceholders(summaryText || selectedTemplate?.summary_text || '', placeholderContext)),
    [summaryText, selectedTemplate, placeholderContext]
  );

  const declarationText = useMemo(() => {
    const source = minorMode
      ? selectedTemplate?.guardian_declaration_text || selectedTemplate?.declaration_text || ''
      : selectedTemplate?.declaration_text || '';

    return replaceConsentPlaceholders(source, placeholderContext);
  }, [minorMode, selectedTemplate, placeholderContext]);

  const signatoryLabel = minorMode ? 'Signature of Parent / Guardian' : 'Signature of Patient';
  const signatoryName = minorMode ? guardianName || '________________' : patientName || '________________';
  const signatoryNameLabel = minorMode
    ? (guardianRelationship.trim().toLowerCase() === 'parent' ? 'Parent Name' : 'Guardian Name')
    : 'Patient Name';
  const rawSignatoryDate = visitDate || issueDate || new Date().toISOString().slice(0, 10);
  const signatoryDate = rawSignatoryDate.split('-').length === 3 
    ? `${rawSignatoryDate.split('-')[2]}-${rawSignatoryDate.split('-')[1]}-${rawSignatoryDate.split('-')[0]}`
    : rawSignatoryDate;

  const addRow = () => {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), toothNumber: '', condition: '', procedure: '' }]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const updateRow = (id: string, key: keyof ConditionProcedureRow, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const addAnesthesiaTag = (value: string) => {
    const next = value.trim();
    if (!next) return;
    if (anesthesiaTags.includes(next)) return;
    setAnesthesiaTags((prev) => [...prev, next]);
    setAnesthesiaInput('');
  };

  const removeAnesthesiaTag = (value: string) => {
    setAnesthesiaTags((prev) => prev.filter((tag) => tag !== value));
  };

  const buildCurrentPayload = () => {
    return {
      patient_id: patientId,
      patient_name: patientName,
      patient_age: patientAge,
      patient_gender: patientGender,
      patient_phone: patientPhone,
      doctor_name: doctorName,
      language,
      consent_type_id: consentTypeId,
      consent_type_label: selectedTemplate?.consent_type_label || consentTypeId,
      clinic_name: clinicDisplayName,
      chief_complaint: chiefComplaint,
      associated_complaint: associatedComplaint,
      medical_history: medicalHistory,
      rows,
      diagnosis,
      treatment_plan: treatmentPlan,
      anesthesia_tags: anesthesiaTags,
      issue_date: issueDate,
      visit_date: visitDate,
      minor_mode: minorMode,
      guardian_name: guardianName,
      guardian_relationship: guardianRelationship,
      guardian_phone: guardianPhone,
      summary_text: renderedSummaryText,
      declaration_text: declarationText,
      signature_data_url: signatureDataUrl,
    };
  };

  const buildConsentHtml = () => {
    const tableRowsHtml = rows
      .map(
        (row) =>
          `<tr><td style="border:1px solid #d1d5db;padding:8px;">${escapeHtml(row.toothNumber || '-')}</td><td style="border:1px solid #d1d5db;padding:8px;">${escapeHtml(row.condition || '-')}</td><td style="border:1px solid #d1d5db;padding:8px;">${escapeHtml(row.procedure || '-')}</td></tr>`
      )
      .join('');
    const medicalHistoryHtml = medicalHistoryItems.length
      ? medicalHistoryItems
          .map(
            (item) =>
              `<div style="margin:0 0 6px;"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</div>`
          )
          .join('')
      : '<div style="margin:0;color:#6b7280;">No significant medical history recorded.</div>';
    const sectionsHtml = hydratedSections.map((section) => renderSectionHtml(section)).join('');
    const signatureHtml = signatureDataUrl
      ? `<img src="${signatureDataUrl}" class="print-repeat-sign-image" alt="Signature" />`
      : '<div class="print-repeat-sign-line"></div>';

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Consent - ${escapeHtml(patientName || patientId || 'Patient')}</title>
  <style>
    @page { size: A4; margin: 0; }
    body {
      margin: 0;
      background: #ffffff;
      color: #111827;
      font-family: Arial, sans-serif;
    }
    .consent-print-root {
      width: 794px;
      max-width: 794px;
      margin: 0 auto;
      box-sizing: border-box;
      padding: 0;
    }
    .consent-print-page {
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      padding: 24px 28px 4px;
    }
    .print-table { width: 100%; border-collapse: collapse; }
    .print-thead { display: table-row-group; }
    .print-tbody { display: table-row-group; }
    .print-tfoot { display: table-row-group; }
    .print-page-top-spacer { height: 10mm; }
    .print-footer-content {
      padding: 8px 0 32px 34px;
      background: #ffffff;
    }
    .print-repeat-inner {
      display: grid;
      grid-template-columns: 1fr 150px;
      gap: 16px;
      align-items: start;
    }
    .print-repeat-sign-label,
    .print-repeat-date-label {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .print-repeat-sign-image {
      height: 44px;
      width: 200px;
      object-fit: contain;
      object-position: left;
      display: block;
      border-bottom: 1px solid #9ca3af;
      margin-bottom: 4px;
    }
    .print-repeat-sign-line {
      height: 44px;
      width: 200px;
      border-bottom: 1px solid #9ca3af;
      margin-bottom: 4px;
    }
    .print-repeat-name {
      font-size: 12px;
      color: #374151;
      margin-top: 4px;
    }
    .print-repeat-date-value {
      height: 44px;
      display: flex;
      align-items: flex-end;
      font-size: 12px;
      color: #111827;
      margin-bottom: 4px;
    }
    .sig-block-inflow {
      margin-top: 8px;
      padding-top: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      .print-thead { display: table-header-group; }
      .print-tfoot { display: table-footer-group; }
    }
    .consent-ml-text {
      font-family: 'NotoSansMalayalamLight', 'Noto Sans Malayalam', sans-serif;
    }
  </style>
</head>
<body>
  <div class="consent-print-root">
    <table class="print-table">
      <thead class="print-thead">
        <tr>
          <td>
            <div class="print-page-top-spacer"></div>
          </td>
        </tr>
      </thead>
      <tbody class="print-tbody">
        <tr>
          <td>
            <article class="consent-print-page ${language === 'ml' ? 'consent-ml-text' : ''}">
              <header style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:14px;">
                <div>
                  <h2 style="font-size:28px;line-height:1.2;font-weight:700;margin:0;">${escapeHtml(clinicDisplayName)}</h2>
                  <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">Informed Consent Form</p>
                </div>
                <div style="font-size:12px;color:#4b5563;text-align:right;">
                  <p style="margin:0;"><strong>Issue Date:</strong> ${escapeHtml(issueDate || '-')}</p>
                  <p style="margin:2px 0 0;"><strong>Visit Date:</strong> ${escapeHtml(visitDate || '-')}</p>
                </div>
              </header>

              <section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-size:13px;margin-bottom:16px;">
                <p><strong>Patient:</strong> ${escapeHtml(patientName || '-')}</p>
                <p><strong>Patient ID:</strong> ${escapeHtml(patientId || '-')}</p>
                <p><strong>Age / Gender:</strong> ${escapeHtml([patientAge, patientGender].filter(Boolean).join(' / ') || '-')}</p>
                <p><strong>Phone:</strong> ${escapeHtml(patientPhone || '-')}</p>
                <p style="grid-column:1 / -1;"><strong>Doctor:</strong> ${escapeHtml(doctorName)}</p>
              </section>

              <section style="margin-bottom:16px;font-size:13px;">
                <p><strong>Chief Complaint:</strong> ${escapeHtml(chiefComplaint || '-')}</p>
                <p style="margin-top:6px;"><strong>Associated Complaint:</strong> ${escapeHtml(associatedComplaint || '-')}</p>
              </section>

              <section style="margin-bottom:16px;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th style="border:1px solid #e5e7eb;padding:6px;text-align:left;">Tooth</th>
                      <th style="border:1px solid #e5e7eb;padding:6px;text-align:left;">Condition</th>
                      <th style="border:1px solid #e5e7eb;padding:6px;text-align:left;">Procedure</th>
                    </tr>
                  </thead>
                  <tbody>${tableRowsHtml}</tbody>
                </table>
              </section>

              <section style="margin-bottom:16px;font-size:13px;">
                <h3 style="font-weight:600;font-size:14px;margin:0 0 6px;">Medical History</h3>
                ${medicalHistoryHtml}
              </section>

              <section style="margin-bottom:16px;font-size:13px;">
                <p><strong>Diagnosis:</strong> ${escapeHtml(diagnosis || '-')}</p>
                <p><strong>Treatment Plan:</strong> ${escapeHtml(treatmentPlan || '-')}</p>
                <p><strong>Anesthesia:</strong> ${escapeHtml(anesthesiaText || '-')}</p>
              </section>

              ${minorMode ? `
              <section style="margin-bottom:16px;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;padding:12px;font-size:13px;">
                <p><strong>Guardian Name:</strong> ${escapeHtml(guardianName || '-')}</p>
                <p><strong>Relationship:</strong> ${escapeHtml(guardianRelationship || '-')}</p>
                <p><strong>Guardian Phone:</strong> ${escapeHtml(guardianPhone || '-')}</p>
              </section>
              ` : ''}

              <section style="margin-bottom:18px;">
                <h3 style="font-weight:600;font-size:14px;margin:0 0 12px;">${escapeHtml(consentSummaryHeading)}</h3>
                ${renderedSummaryText && renderedSummaryText.trim() ? `<p style="font-size:13px;line-height:1.6;white-space:pre-wrap;margin:0;">${escapeHtml(renderedSummaryText)}</p>` : ''}
              </section>

              <section style="font-size:13px;line-height:1.6;display:flex;flex-direction:column;gap:12px;">
                ${sectionsHtml}
              </section>

              <section class="sig-block-inflow">
                <p style="font-size:13px;line-height:1.6;white-space:pre-wrap;margin:0;">${escapeHtml(declarationText)}</p>
              </section>
            </article>
          </td>
        </tr>
      </tbody>
      <tfoot class="print-tfoot">
        <tr>
          <td>
            <div class="print-footer-content ${language === 'ml' ? 'consent-ml-text' : ''}">
              <div class="print-repeat-inner">
                <div>
                  <div class="print-repeat-sign-label">${escapeHtml(signatoryLabel)}</div>
                  ${signatureHtml}
                  <div class="print-repeat-name">${escapeHtml(signatoryNameLabel)}: ${escapeHtml(signatoryName)}</div>
                </div>
                <div>
                  <div class="print-repeat-date-label">Date</div>
                  <div class="print-repeat-date-value">${escapeHtml(signatoryDate)}</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</body>
</html>
    `;
  };

  const generateConsentPdfBlob = async () => {
    const fileLabel = `${patientName || patientId || 'patient'}-${selectedTemplate?.consent_type_label || consentTypeId || 'consent'}`
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `${fileLabel || 'consent-form'}.pdf`;

    const previewRoot = previewRootRef.current;
    if (previewRoot) {
      try {
        return await generatePdfBlobFromElementWithRepeatedFooter(previewRoot, '.print-footer-content', {
          topMarginMm: 12,
          footerGapMm: 5,
        });
      } catch (error) {
        console.warn('Primary consent PDF generation failed; falling back to HTML renderer.', error);
      }
    }

    return generatePdfBlobFromHtml(buildConsentHtml(), filename);
  };

  const handleSaveConsent = async () => {
    if (!patientId) {
      toast.error('Patient context is required before saving');
      return;
    }

    if (!consentTypeId) {
      toast.error('Select a consent type first');
      return;
    }

    setIsSavingConsent(true);
    try {
      const pdfBlob = await generateConsentPdfBlob();
      const pdfBase64 = await blobToBase64(pdfBlob);
      const fileName = `${patientId}-${consentTypeId}-${new Date().toISOString().slice(0, 10)}.pdf`;

      await consentFormService.saveConsentArtifacts({
        patient_id: patientId,
        consent_type_id: consentTypeId,
        consent_type_label: selectedTemplate?.consent_type_label || consentTypeId,
        language,
        clinic: clinicId || undefined,
        summary_text: renderedSummaryText,
        signature_data_url: signatureDataUrl || undefined,
        consent_pdf_base64: pdfBase64,
        consent_pdf_filename: fileName,
        payload: buildCurrentPayload(),
        signer_name: minorMode ? guardianName || patientName : patientName,
        signer_role: minorMode ? 'Parent/Guardian' : 'Patient',
      });

      notifyConsentSaved(patientId, consentTypeId);
      setSignatureDataUrl('');
      toast.success('Consent form saved');
    } catch (error: any) {
      console.error('Failed to save consent artifacts', error);
      toast.error(error?.message || 'Could not save consent form');
    } finally {
      setIsSavingConsent(false);
    }
  };

  const handlePrint = async () => {
    try {
      toast.loading('Preparing print preview...', { id: 'consent-print' });
      const pdfBlob = await generateConsentPdfBlob();
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');

      if (!printWindow) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${patientId || 'patient'}-${consentTypeId || 'consent'}.pdf`;
        link.click();
      } else {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (e) {
            console.error('Auto print failed', e);
          }
        }, 700);
      }

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success('Print preview opened', { id: 'consent-print' });
    } catch (error) {
      console.error('Failed to open print preview', error);
      toast.error('Failed to open print preview', { id: 'consent-print' });
    }
  };

  const openSignatureModal = () => {
    setSignatureModalOpen(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.scale(ratio, ratio);
      context.lineWidth = 2;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.strokeStyle = '#1f2937';

      if (signatureDataUrl) {
        const image = new Image();
        image.onload = () => context.drawImage(image, 0, 0, width, height);
        image.src = signatureDataUrl;
      }
    }, 50);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    context?.beginPath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
    setSignatureModalOpen(false);
    toast.success('Signature applied to preview');
  };

  return (
    <div className={`flex ${embedMode ? 'h-full min-h-[900px]' : 'h-[100dvh] overflow-hidden'} bg-primary-50`}>
      {!embedMode && <Sidebar />}

      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${embedMode ? '' : 'lg:pl-20'}`}>
        {!embedMode && (
          <TopBar
            title="Consent Form Builder"
            onBack={() => navigate(returnTo || (patientQuery ? `/prescriptions/${patientQuery}?section=consent` : '/patients'))}
            showMenu
          />
        )}

        <div className="consent-topbar px-4 sm:px-6 py-3 border-b bg-white flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={openSignatureModal}>eSignature</Button>
          <Button size="sm" onClick={handleSaveConsent} isLoading={isSavingConsent}>Save</Button>
          <Button size="sm" onClick={handlePrint}>Print</Button>
        </div>

        <div className="lg:hidden px-4 py-2 border-b bg-white">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMobilePanel('builder')}
              className={`rounded-lg px-3 py-2 text-sm font-medium border ${mobilePanel === 'builder' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Builder
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel('preview')}
              className={`rounded-lg px-3 py-2 text-sm font-medium border ${mobilePanel === 'preview' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-[480px_minmax(0,1fr)] h-full min-h-0">
            <aside className={`consent-builder-panel overflow-y-auto overscroll-contain min-h-0 border-r bg-white px-4 sm:px-6 py-4 space-y-4 ${mobilePanel === 'preview' ? 'hidden lg:block' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consent Type</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                  value={consentTypeId}
                  onChange={(event) => {
                    setConsentTypeId(event.target.value);
                    setSummaryEdited(false);
                  }}
                  disabled={isLoadingTemplates}
                >
                  {consentTypes.map((row) => (
                    <option key={row.id} value={row.id}>{row.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`px-3 py-2 rounded-lg border text-sm font-medium ${language === 'en' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    onClick={() => {
                      setLanguage('en');
                      setSummaryEdited(false);
                    }}
                  >
                    English
                  </button>
                  <button
                    className={`px-3 py-2 rounded-lg border text-sm font-medium ${language === 'ml' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    onClick={() => {
                      setLanguage('ml');
                      setSummaryEdited(false);
                    }}
                  >
                    Malayalam
                  </button>
                </div>
              </div>

              {!lockedPatientContext && (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                      <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={patientId} onChange={(event) => setPatientId(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                      <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={patientName} onChange={(event) => setPatientName(event.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={patientAge} onChange={(event) => setPatientAge(event.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={patientGender} onChange={(event) => setPatientGender(event.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input className="w-full rounded-lg border border-gray-300 px-3 py-2" value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                      <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[72px]" value={chiefComplaint} onChange={(event) => setChiefComplaint(event.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Associated Complaint</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[72px]" value={associatedComplaint} onChange={(event) => setAssociatedComplaint(event.target.value)} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Condition / Procedure Rows</label>
                  <button type="button" onClick={addRow} className="text-xs text-primary-600 font-semibold">+ Add Row</button>
                </div>

                <div className="space-y-2">
                  {rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr_auto] gap-2 items-start">
                      <div>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={row.toothNumber}
                          onChange={(event) => updateRow(row.id, 'toothNumber', event.target.value)}
                        >
                          <option value="">Tooth no.</option>
                          {row.toothNumber && !toothOptions.includes(row.toothNumber) && (
                            <option value={row.toothNumber}>{row.toothNumber}</option>
                          )}
                          {toothOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={row.condition}
                          onChange={(event) => updateRow(row.id, 'condition', event.target.value)}
                        >
                          <option value="">{isLoadingCatalogs ? 'Loading conditions...' : 'Select condition'}</option>
                          {row.condition && !conditionOptions.includes(row.condition) && (
                            <option value={row.condition}>{row.condition}</option>
                          )}
                          {conditionOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={row.procedure}
                          onChange={(event) => updateRow(row.id, 'procedure', event.target.value)}
                        >
                          <option value="">{isLoadingCatalogs ? 'Loading procedures...' : 'Select procedure'}</option>
                          {row.procedure && !procedureOptions.includes(row.procedure) && (
                            <option value={row.procedure}>{row.procedure}</option>
                          )}
                          {procedureOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="h-10 w-10 inline-flex items-center justify-center text-red-500 sm:self-center hover:bg-red-50 rounded-lg"
                        onClick={() => removeRow(row.id)}
                        title="Remove row"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis & Treatment Plan</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[72px]" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Diagnosis" />
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[72px] mt-2" value={treatmentPlan} onChange={(event) => setTreatmentPlan(event.target.value)} placeholder="Treatment plan" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anesthesia</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {anesthesiaPresets.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`px-2.5 py-1 rounded-full text-xs border ${anesthesiaTags.includes(tag) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                      onClick={() => (anesthesiaTags.includes(tag) ? removeAnesthesiaTag(tag) : addAnesthesiaTag(tag))}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={anesthesiaInput}
                    placeholder="Add custom anesthesia"
                    onChange={(event) => setAnesthesiaInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addAnesthesiaTag(anesthesiaInput);
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => addAnesthesiaTag(anesthesiaInput)}>Add</Button>
                </div>
                {anesthesiaTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {anesthesiaTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                        {tag}
                        <button type="button" onClick={() => removeAnesthesiaTag(tag)}>Ã—</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={minorMode}
                    onChange={(event) => setMinorMode(event.target.checked)}
                  />
                  Minor patient flow (guardian required)
                </label>

                {minorMode && (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={guardianName} onChange={(event) => setGuardianName(event.target.value)} placeholder="Guardian name" />
                    <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={guardianRelationship} onChange={(event) => setGuardianRelationship(event.target.value)} placeholder="Relationship" />
                    <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={guardianPhone} onChange={(event) => setGuardianPhone(event.target.value)} placeholder="Guardian phone" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Consent Summary Text</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSummaryEdited(false);
                      setSummaryText(selectedTemplate?.summary_text || '');
                    }}
                    className="text-xs text-primary-600 font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[280px] resize-y"
                  value={summaryText}
                  onChange={(event) => {
                    setSummaryEdited(true);
                    setSummaryText(event.target.value);
                  }}
                />
              </div>
            </aside>

            <main className={`consent-preview-panel overflow-y-auto overscroll-contain min-h-0 bg-gray-100 p-4 sm:p-6 ${mobilePanel === 'builder' ? 'hidden lg:block' : ''}`}>
              <div className="max-w-[900px] mx-auto bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div ref={previewRootRef} className="consent-print-root">
                  <table className="print-table w-full border-collapse">
                    <tbody className="print-tbody">
                      <tr>
                        <td>
                          <article className={`consent-print-page pt-6 px-6 pb-2 sm:pt-8 sm:px-8 sm:pb-2 ${language === 'ml' ? 'consent-ml-text' : ''}`}>
                          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-3 mb-4">
                            <div>
                              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{clinicDisplayName}</h2>
                              <p className="text-xs text-gray-500">Informed Consent Form</p>
                            </div>
                            <div className="text-xs text-gray-600 text-right">
                              <p><strong>Issue Date:</strong> {issueDate || '-'}</p>
                              <p><strong>Visit Date:</strong> {visitDate || '-'}</p>
                            </div>
                          </header>

                          <section className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
                            <p><strong>Patient:</strong> {patientName || '-'}</p>
                            <p><strong>Patient ID:</strong> {patientId || '-'}</p>
                            <p><strong>Age / Gender:</strong> {[patientAge, patientGender].filter(Boolean).join(' / ') || '-'}</p>
                            <p><strong>Phone:</strong> {patientPhone || '-'}</p>
                            <p className="md:col-span-2"><strong>Doctor:</strong> {doctorName}</p>
                          </section>

                          <section className="mb-4 text-sm">
                            <p><strong>Chief Complaint:</strong> {chiefComplaint || '-'}</p>
                            <p className="mt-1"><strong>Associated Complaint:</strong> {associatedComplaint || '-'}</p>
                          </section>

                          <section className="mb-4">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-200 px-2 py-1 text-left">Tooth</th>
                                  <th className="border border-gray-200 px-2 py-1 text-left">Condition</th>
                                  <th className="border border-gray-200 px-2 py-1 text-left">Procedure</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row) => (
                                  <tr key={row.id}>
                                    <td className="border border-gray-200 px-2 py-1">{row.toothNumber || '-'}</td>
                                    <td className="border border-gray-200 px-2 py-1">{row.condition || '-'}</td>
                                    <td className="border border-gray-200 px-2 py-1">{row.procedure || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>

                          <section className="mb-4 text-sm space-y-1">
                            <h3 className="font-semibold text-sm mb-1">Medical History</h3>
                            {medicalHistoryItems.length > 0 ? (
                              <div className="space-y-1">
                                {medicalHistoryItems.map((item) => (
                                  <p key={`${item.label}-${item.value}`}>
                                    <strong>{item.label}:</strong> {item.value}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No significant medical history recorded.</p>
                            )}
                          </section>

                          <section className="mb-4 text-sm space-y-1">
                            <p><strong>Diagnosis:</strong> {diagnosis || '-'}</p>
                            <p><strong>Treatment Plan:</strong> {treatmentPlan || '-'}</p>
                            <p><strong>Anesthesia:</strong> {anesthesiaText || '-'}</p>
                          </section>

                          {minorMode && (
                            <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                              <p><strong>Guardian Name:</strong> {guardianName || '-'}</p>
                              <p><strong>Relationship:</strong> {guardianRelationship || '-'}</p>
                              <p><strong>Guardian Phone:</strong> {guardianPhone || '-'}</p>
                            </section>
                          )}

                          <section className="mb-5">
                            <h3 className="font-semibold text-sm mb-3">{consentSummaryHeading}</h3>
                            {renderedSummaryText && renderedSummaryText.trim() && (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{renderedSummaryText}</p>
                            )}
                          </section>

                          <section className="space-y-4 text-sm leading-relaxed">
                            {hydratedSections.map((section, index) => (
                              <div key={index}>
                                {section.heading && <h4 className="font-semibold text-gray-900 mb-1">{section.heading}</h4>}
                                {section.body && <p className="whitespace-pre-wrap">{section.body}</p>}
                                {section.items && section.items.length > 0 && (
                                  <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                                  </ul>
                                )}
                                {section.numbered && section.numbered.length > 0 && (
                                  <ol className="list-decimal pl-5 mt-1 space-y-1">
                                    {section.numbered.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                                  </ol>
                                )}
                                {section.footer && <p className="whitespace-pre-wrap mt-1">{section.footer}</p>}
                              </div>
                            ))}
                          </section>

                          <section className="sig-block-inflow mt-2 pt-1">
                            <p className="text-sm whitespace-pre-wrap">{declarationText}</p>
                          </section>
                        </article>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="print-tfoot">
                    <tr>
                      <td>
                        <div className={`print-footer-content pl-10 pr-6 sm:pl-12 sm:pr-8 py-3 pb-12 sm:pb-16 ${language === 'ml' ? 'consent-ml-text' : ''}`}>
                          <div className="print-repeat-inner grid grid-cols-[1fr_150px] gap-4 items-start">
                            <div>
                              <p className="print-repeat-sign-label text-xs font-semibold text-gray-500 mb-1">{signatoryLabel}</p>
                              {signatureDataUrl ? (
                                <img src={signatureDataUrl} alt="Signature" className="print-repeat-sign-image h-11 w-56 object-contain object-left border-b border-gray-400 mb-1" />
                              ) : (
                                <div className="print-repeat-sign-line h-11 w-56 border-b border-gray-400 mb-1" />
                              )}
                              <p className="print-repeat-name text-xs text-gray-700 mt-1">{signatoryNameLabel}: {signatoryName}</p>
                            </div>
                            <div>
                              <p className="print-repeat-date-label text-xs font-semibold text-gray-500 mb-1">Date</p>
                              <p className="print-repeat-date-value text-xs text-gray-900 h-11 flex items-end mb-1">{signatoryDate}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                  </table>
                </div>
              </div>
            </main>
          </div>
        </div>

        {!embedMode && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab === 'home') navigate('/home');
              if (tab === 'appointments') navigate('/appointments');
              if (tab === 'new-appointment') navigate('/appointments/new', { state: { backgroundLocation: location } });
              if (tab === 'profile') navigate('/profile');
            }}
          />
        )}
      </div>

      {signatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Capture eSignature</h3>
            <p className="text-sm text-gray-500 mb-3">Draw the signature and save it to apply across all consent pages.</p>
            <div className="border rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-56 touch-none"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={clearSignature}>Clear</Button>
              <Button size="sm" variant="outline" onClick={() => setSignatureModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveSignature}>Apply Signature</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentFormBuilderPage;
