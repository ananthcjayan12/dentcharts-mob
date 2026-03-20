
import { PrescriptionPrintMedicine } from './prescriptionTemplates';

export interface CaseDiaryEntry {
  visit_date: string;
  reason_for_visit?: string;
  clinical_notes?: string;
  diagnosis?: string;
  procedures?: string[];
  doctor_name?: string;
  invoice_id?: string;
  invoice_amount?: number;
  payment_status?: 'Paid' | 'Unpaid' | 'Partially Paid';
}

export interface OrthodonticSummaryData {
  case_type: string;
  estimated_duration?: string;
  package_cost: number;
  advance_paid: number;
  remaining_balance: number;
  ledger: Array<{
    visit_date: string;
    payment: number;
    balance: number;
    notes?: string;
    next_appt?: string;
  }>;
}

export interface BillingEntry {
  date: string;
  description: string;
  payment_type?: string;
  amount: number;
}

export interface PatientSummaryPrintData {
  // Header
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicLogo?: string;
  doctorName: string;
  doctorQualification?: string;
  generatedDate: string;

  // Profile
  patientName: string;
  patientId: string;
  dob?: string;
  age?: string;
  bloodGroup?: string;
  gender?: string;
  language?: string;

  // Medical History
  bloodPressure?: string;
  medicalSummary?: string;
  existingConditions?: string[];
  allergies?: string[];
  familyHistory?: string;
  vaccinationStatus?: string;

  // Sections
  caseDiary: CaseDiaryEntry[];
  orthodontic?: OrthodonticSummaryData;
  recordImages: Array<{ url: string; label: string; date: string }>;
  billing: {
    entries: BillingEntry[];
    totalInvoiced: number;
    totalPaid: number;
    totalDue: number;
  };
  nextAppointment?: {
    date: string;
    time: string;
    location: string;
    startIso?: string;
    endIso?: string;
  };
}

const escapeHtml = (value?: string | number | null): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export function generatePatientSummaryHTML(data: PatientSummaryPrintData): string {
  const {
    clinicName, clinicAddress, clinicPhone, clinicEmail, clinicLogo,
    doctorName, doctorQualification, generatedDate,
    patientName, patientId, dob, age, bloodGroup, gender, language,
    bloodPressure, medicalSummary, existingConditions, allergies, familyHistory, vaccinationStatus,
    caseDiary, orthodontic, recordImages, billing, nextAppointment
  } = data;

  const calendarTitle = `Dental Appointment - ${patientName}`;
  const calendarStart = nextAppointment?.startIso ? new Date(nextAppointment.startIso) : null;
  const calendarEnd = nextAppointment?.endIso
    ? new Date(nextAppointment.endIso)
    : (calendarStart ? new Date(calendarStart.getTime() + 30 * 60 * 1000) : null);
  const googleCalendarUrl =
    calendarStart && calendarEnd && !Number.isNaN(calendarStart.getTime()) && !Number.isNaN(calendarEnd.getTime())
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarTitle)}&dates=${calendarStart.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}/${calendarEnd.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}&location=${encodeURIComponent(nextAppointment?.location || clinicName)}&details=${encodeURIComponent(`Appointment for ${patientName}`)}`
      : '';

  const logoMarkup = clinicLogo
    ? `<img class="clinic-logo" src="${escapeHtml(clinicLogo)}" alt="${escapeHtml(clinicName)} logo" />`
    : `<div class="clinic-placeholder-logo"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2c0 .942-.716 1.761-1.666 2H4a2 2 0 00-2 2v6c0 1.954.512 3.824 1.455 5.467A8.04 8.04 0 005.152 21.6a2 2 0 003.545-1.574A1 1 0 0110 19h4a1 1 0 011.303 1.026 2 2 0 003.545 1.574 8.045 8.045 0 001.697-4.133C21.488 15.824 22 13.954 22 12V6a2 2 0 00-2-2h-1.334A1.914 1.914 0 0017 2v2a1 1 0 01-1 1h-8a1 1 0 01-1-1V2H7z"/></svg></div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patient Summary - ${escapeHtml(patientName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    :root {
      --primary: #1d4ed8;
      --primary-light: #eff6ff;
      --success: #15803d;
      --success-light: #f0fdf4;
      --danger: #b91c1c;
      --danger-light: #fef2f2;
      --warning: #a16207;
      --warning-light: #fefce8;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-500: #6b7280;
      --gray-700: #374151;
      --gray-900: #111827;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      color: var(--gray-900);
      background: #fff;
      font-family: 'Poppins', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
    }

    .page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px;
    }

    /* Page Setup */
    @page {
      size: A4;
      margin: 18mm 12mm;
    }

    body {
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      color: var(--gray-900);
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
    }

    .page {
      width: 100%;
      background: #fff;
      padding-top: 10mm;
      padding-bottom: 10mm;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 20px;
    }

    .clinic-info-container {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .clinic-logo {
      height: 70px;
      width: auto;
      max-width: 120px;
      object-fit: contain;
    }

    .doctor-details {
      display: flex;
      flex-direction: column;
    }

    .clinic-header-name {
      font-size: 15pt;
      font-weight: 800;
      color: var(--primary);
      margin: 0;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }

    .doctor-specialization {
      font-size: 11pt;
      font-weight: 600;
      color: var(--gray-800);
      margin-top: 4px;
      display: flex;
      align-items: center;
    }

    .doctor-specialization span.divider {
      margin: 0 8px;
      color: var(--gray-300);
      font-weight: 300;
    }

    .clinic-address-text {
      font-size: 9.5pt;
      color: var(--gray-500);
      margin-top: 3px;
      line-height: 1.3;
      max-width: 450px;
    }

    .report-label {
      text-align: right;
      min-width: 160px;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      flex-shrink: 0;
    }

    .label-text {
      display: inline-block;
      padding: 4px 12px;
      background: var(--primary);
      color: #fff;
      font-size: 8pt;
      font-weight: 800;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .main-title {
      font-size: 18pt;
      font-weight: 800;
      margin: 25px 0 5px;
      color: var(--gray-900);
      text-align: left;
    }

    .generated-date {
      font-size: 8.5pt;
      color: var(--gray-500);
      margin-bottom: 20px;
    }

    hr {
      border: 0;
      border-top: 1px solid var(--gray-200);
      margin: 20px 0;
    }

    /* Section Styling */
    .section {
      margin-bottom: 25px;
      break-inside: avoid;
    }

    .section-header {
      background: var(--gray-50);
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--gray-100);
    }

    .section-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-content {
      padding: 20px;
    }

    /* GRID LAYOUTS */
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .data-item {
      margin-bottom: 10px;
    }

    .data-label {
      font-size: 8pt;
      font-weight: 500;
      color: var(--gray-500);
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .data-value {
      font-size: 10pt;
      font-weight: 600;
      color: var(--gray-900);
    }

    .data-value.danger {
      color: var(--danger);
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }

    .badge-success { background: var(--success-light); color: var(--success); }
    .badge-primary { background: var(--primary-light); color: var(--primary); }

    /* CASE DIARY TIMELINE */
    .timeline {
      position: relative;
      padding-left: 20px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 0;
      top: 5px;
      bottom: 0;
      width: 2px;
      background: var(--gray-200);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 30px;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: -24px;
      top: 5px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid #fff;
    }

    .visit-date {
      font-size: 9pt;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .visit-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 15px;
      align-items: start;
    }

    .procedure-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: flex-start;
      margin-top: 5px;
    }

    .procedure-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: #fff;
      font-size: 8pt;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      line-height: 1.35;
      vertical-align: top;
      text-align: center;
    }

    .invoice-card {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .invoice-amount {
      font-weight: 700;
      font-size: 11pt;
    }

    /* ORTHODONTIC TRACKER */
    .ortho-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .ortho-stat-card {
      padding: 10px;
      border-radius: 8px;
      text-align: center;
    }

    .ortho-stat-card.success { background: var(--success-light); color: var(--success); }
    .ortho-stat-card.primary { background: var(--primary-light); color: var(--primary); }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }

    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid var(--gray-100);
    }

    th {
      font-weight: 600;
      color: var(--gray-500);
      background: var(--gray-50);
    }

    /* IMAGES */
    .image-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }

    .image-card {
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      overflow: hidden;
    }

    .image-thumb {
      width: 100%;
      height: 100px;
      object-fit: cover;
      background: var(--gray-100);
    }

    .image-info {
      padding: 5px;
      font-size: 7pt;
      text-align: center;
    }

    /* BILLING SUMMARY */
    .billing-totals {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--gray-200);
    }

    .total-item {
      text-align: center;
    }

    .total-label {
      font-size: 8pt;
      font-weight: 600;
      color: var(--gray-500);
      text-transform: uppercase;
    }

    .total-value {
      font-size: 14pt;
      font-weight: 700;
    }

    /* NEXT APPOINTMENT */
    .next-appt-card {
      background: var(--primary);
      color: #fff;
      padding: 25px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .next-appt-info h2 {
      margin: 0;
      font-size: 18pt;
      font-weight: 700;
      color: #fff;
    }

    .next-appt-info p {
      margin: 5px 0 0;
      font-size: 10pt;
      opacity: 0.9;
    }

    .btn-calendar {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      color: #fff;
      padding: 8px 15px;
      border-radius: 6px;
      font-size: 9pt;
      font-weight: 600;
      text-decoration: none;
    }

    .print-page-number {
      display: none;
    }

    @media print {
      body { padding: 0; }
      .page { padding: 10mm 0 10mm; width: 100%; max-width: none; }
      .visit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .procedure-tags {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 6px 8px;
      }
      .procedure-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: auto;
        max-width: 100%;
        font-size: 8.5pt;
        line-height: 1.4;
        padding: 5px 10px;
        white-space: normal;
        word-break: break-word;
        overflow: visible;
        text-align: center;
      }
      .report-label { min-width: 140px; }
      .no-print { display: none; }
      .print-page-number {
        display: block;
        position: fixed;
        right: 0;
        bottom: 4mm;
        font-size: 8pt;
        color: var(--gray-500);
      }
      .print-page-number::after {
        content: counter(page);
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="clinic-info-container">
        ${logoMarkup}
        <div class="doctor-details">
          <div class="clinic-header-name">${escapeHtml(clinicName)}</div>
          ${doctorName ? `
            <div class="doctor-specialization" style="color:var(--primary); font-size:12pt">
              ${escapeHtml(doctorName)}
              ${doctorQualification ? `<span class="divider">|</span> ${escapeHtml(doctorQualification)}` : ''}
            </div>
          ` : ''}
          <div class="clinic-address-text">${escapeHtml(clinicAddress)}</div>
        </div>
      </div>
      <div class="report-label">
        <div class="label-text">Patient Record</div>
      </div>
    </header>

    <h1 class="main-title">Patient Summary</h1>
    <div class="generated-date">Generated on ${generatedDate}</div>

    <hr />

    <!-- PATIENT PROFILE -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">Patient Profile</div>
      </div>
      <div class="section-content">
        <div class="grid-3">
          <div class="data-item">
            <div class="data-label">Full Name</div>
            <div class="data-value">${escapeHtml(patientName)}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Age / DOB</div>
            <div class="data-value">${age ? `${age} Years` : '--'} ${dob ? `(${dob})` : ''}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Patient ID</div>
            <div class="data-value">${escapeHtml(patientId)}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Blood Type</div>
            <div class="data-value">${escapeHtml(bloodGroup || '--')}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Gender</div>
            <div class="data-value">${escapeHtml(gender || '--')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- MEDICAL HISTORY -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">Medical History</div>
      </div>
      <div class="section-content">
        <div class="grid-2">
          <div class="data-item">
            <div class="data-label">Blood Pressure</div>
            <div class="data-value">${escapeHtml(bloodPressure || 'Normal')}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Summary</div>
            <div class="data-value">${escapeHtml(medicalSummary || 'No Relevant Medical History (NRMH)')}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Existing Conditions</div>
            <div class="data-value">${existingConditions?.length ? existingConditions.join(', ') : 'None'}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Known Allergies</div>
            <div class="data-value danger">${allergies?.length ? allergies.join(', ') : 'None'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- CASE DIARY -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">Case Diary (Visit History)</div>
      </div>
      <div class="section-content">
        <div class="timeline">
          ${caseDiary.map(item => `
            <div class="timeline-item">
              <div class="visit-date">${item.visit_date}</div>
              <div class="visit-grid">
                ${item.reason_for_visit ? `
                  <div class="data-item">
                    <div class="data-label">Reason for Visit</div>
                    <div class="data-value">${escapeHtml(item.reason_for_visit)}</div>
                  </div>
                ` : ''}
                ${item.diagnosis ? `
                  <div class="data-item">
                    <div class="data-label">Diagnosis / Condition</div>
                    <div class="data-value">${escapeHtml(item.diagnosis)}</div>
                  </div>
                ` : ''}
                ${item.doctor_name ? `
                  <div class="data-item">
                    <div class="data-label">Doctor</div>
                    <div class="data-value">${escapeHtml(item.doctor_name)}</div>
                  </div>
                ` : ''}
              </div>
              
              ${item.clinical_notes ? `
                <div class="data-item" style="margin-top:12px">
                  <div class="data-label">Clinical Notes</div>
                  <div class="data-value" style="font-weight:400; font-size:9pt; line-height:1.5; color:var(--gray-700)">${escapeHtml(item.clinical_notes)}</div>
                </div>
              ` : ''}

              ${item.procedures?.length ? `
                <div class="data-item" style="margin-top:12px">
                  <div class="data-label">Procedures Performed</div>
                  <div class="procedure-tags">
                    ${item.procedures.map(p => `<span class="procedure-tag">${escapeHtml(p)}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              ${item.invoice_id ? `
                <div class="invoice-card" style="margin-top:20px; background: var(--gray-50); border: 1px solid var(--gray-200); padding: 16px; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 40px;">
                    <div style="flex: 1;">
                      <div style="font-size:7pt; color:var(--gray-500); font-weight:700; text-transform: uppercase; margin-bottom:6px">Linked Invoice</div>
                      <div style="font-size:10pt; font-weight:800; color:var(--gray-900); letter-spacing:0.5px">${item.invoice_id}</div>
                    </div>
                    <div style="text-align: right; min-width: 120px;">
                      <div class="invoice-amount" style="color: var(--primary); font-size:11.5pt; font-weight:800; margin-bottom: 6px;">₹${item.invoice_amount?.toLocaleString()}</div>
                      <div class="badge ${item.payment_status === 'Paid' ? 'badge-success' : 'badge-primary'}" style="font-size: 8pt; padding:4px 12px; font-weight:700">${item.payment_status}</div>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>




    <!-- ORTHODONTIC TRACKER (Conditional) -->
    ${orthodontic ? `
    <div class="section">
      <div class="section-header">
        <div class="section-title">Orthodontic Tracker</div>
      </div>
      <div class="section-content">
        <div class="grid-5 ortho-stats">
          <div class="data-item">
            <div class="data-label">Case Type</div>
            <div class="data-value">${escapeHtml(orthodontic.case_type)}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Est. Duration</div>
            <div class="data-value">${escapeHtml(orthodontic.estimated_duration)}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Package Cost</div>
            <div class="data-value">₹${orthodontic.package_cost.toLocaleString()}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Advance Paid</div>
            <div class="data-value" style="color:var(--success)">₹${orthodontic.advance_paid.toLocaleString()}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Current Balance</div>
            <div class="data-value" style="color:var(--primary)">₹${orthodontic.remaining_balance.toLocaleString()}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date of Visit</th>
              <th>Payment</th>
              <th>Balance</th>
              <th>Notes</th>
              <th>Next Appt.</th>
            </tr>
          </thead>
          <tbody>
            ${orthodontic.ledger.map(entry => `
              <tr>
                <td>${entry.visit_date}</td>
                <td>₹${entry.payment.toLocaleString()}</td>
                <td style="color:var(--primary); font-weight:600">₹${entry.balance.toLocaleString()}</td>
                <td>${escapeHtml(entry.notes)}</td>
                <td>${entry.next_appt || '--'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- PATIENT RECORD IMAGES -->
    ${recordImages.length ? `
    <div class="section">
      <div class="section-header">
        <div class="section-title">Patient Record Images</div>
      </div>
      <div class="section-content">
        <div class="image-grid">
          ${recordImages.map(img => `
            <div class="image-card">
              <img src="${img.url}" class="image-thumb" />
              <div class="image-info">
                <strong>${escapeHtml(img.label)}</strong><br/>
                ${img.date}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    <!-- BILLING SUMMARY -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">Billing Summary</div>
      </div>
      <div class="section-content">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Payment Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${billing.entries.map(entry => `
              <tr>
                <td>${entry.date}</td>
                <td>${escapeHtml(entry.description)}</td>
                <td style="color:var(--gray-500)">${escapeHtml(entry.payment_type || '--')}</td>
                <td>₹${entry.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="billing-totals">
          <div class="total-item">
            <div class="total-label">Total Invoiced</div>
            <div class="total-value">₹${billing.totalInvoiced.toLocaleString()}</div>
          </div>
          <div class="total-item">
            <div class="total-label">Total Paid</div>
            <div class="total-value" style="color:var(--success)">₹${billing.totalPaid.toLocaleString()}</div>
          </div>
          <div class="total-item">
            <div class="total-label" style="color:var(--danger)">Total Due</div>
            <div class="total-value" style="color:var(--primary)">₹${billing.totalDue.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- NEXT APPOINTMENT -->
    ${nextAppointment ? `
    <div class="next-appt-card">
      <div class="next-appt-info">
        <p style="text-transform:uppercase; font-size:8pt; font-weight:600; margin-bottom:10px">Next Appointment</p>
        <h2>${nextAppointment.date}</h2>
        <p>${nextAppointment.time} — ${escapeHtml(nextAppointment.location)}</p>
      </div>
      <div class="no-print">
        <a href="${googleCalendarUrl || '#'}" class="btn-calendar" target="_blank" rel="noopener noreferrer" onclick="if (!this.href || this.href.endsWith('#')) { downloadIcsEvent(); return false; } return true;">Add to Calendar</a>
      </div>
    </div>
    ` : ''}
    <div class="print-page-number">Page </div>
  </div>
</body>
<script>
  function downloadIcsEvent() {
    ${nextAppointment ? `
    var start = ${JSON.stringify(nextAppointment.startIso || '')};
    var end = ${JSON.stringify(nextAppointment.endIso || '')};
    if (!start) return;
    var startDate = new Date(start);
    var endDate = end ? new Date(end) : new Date(startDate.getTime() + 30 * 60 * 1000);
    var formatIcsDate = function(d) {
      return d.toISOString().replace(/[-:]/g, '').replace(/\\.\\d{3}Z$/, 'Z');
    };
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DentCharts//Patient Summary//EN',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@dentcharts',
      'DTSTAMP:' + formatIcsDate(new Date()),
      'DTSTART:' + formatIcsDate(startDate),
      'DTEND:' + formatIcsDate(endDate),
      'SUMMARY:' + ${JSON.stringify(calendarTitle)},
      'LOCATION:' + ${JSON.stringify(nextAppointment.location || clinicName)},
      'DESCRIPTION:' + ${JSON.stringify(`Appointment for ${patientName}`)},
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    var blob = new Blob([lines.join('\\r\\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'appointment.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ` : ''}
  }
</script>
</html>`;
}

