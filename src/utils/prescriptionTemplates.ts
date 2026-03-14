// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface PrescriptionPrintMedicine {
  medicine_name: string;
  dosage?: string;
  strength?: string;
  dosage_form?: string;
  morning?: number;
  lunch?: number;
  night?: number;
  days?: number | string;
  condition?: string;
  instructions?: string;
  frequency?: string;
  comment?: string;
}

export interface PrescriptionPrintData {
  prescriptionId?: string;
  patientName: string;
  patientId?: string;
  patientAge?: string;
  patientGender?: string;
  patientPhone?: string;
  doctorName: string;
  doctorQualification?: string;
  doctorRegNo?: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicLogo?: string;
  medications: PrescriptionPrintMedicine[];
  diagnosis?: string;
  notes?: string;
  prescriptionDate: string;
  nextAppointment?: string;
}

const escapeHtml = (value?: string | number | null): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDoctorName = (doctorName?: string): string => {
  const normalized = String(doctorName || '').trim().replace(/^dr\.?\s+/i, '').trim();
  return normalized ? `Dr ${normalized}` : 'Doctor';
};

const hasDisplayValue = (value?: string | number | null): boolean => {
  const normalized = String(value ?? '').trim();
  return Boolean(normalized && normalized !== '--' && normalized !== '---');
};

const formatDuration = (value?: string | number): string => {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return '';
  }

  return /day/i.test(normalized) ? normalized : `${normalized} days`;
};

const formatFrequency = (med: PrescriptionPrintMedicine) => {
  if (med.frequency) {
    return med.frequency;
  }

  return `${med.morning || 0}-${med.lunch || 0}-${med.night || 0}`;
};

const renderMedicationRows = (medications: PrescriptionPrintMedicine[]) => {
  return medications.map((med, i) => {
    const instructions = [
      formatDuration(med.days),
      med.condition ? med.condition : '',
      med.comment ? med.comment : '',
    ].filter(Boolean).join('; ');

    return `
      <tr>
        <td class="cell num-cell"><strong>${i + 1}.</strong></td>
        <td class="cell medicine-cell">
          <div class="medicine-name">${escapeHtml(med.medicine_name)}</div>
          ${(med.dosage_form || med.strength) ? `<div class="medicine-meta">${escapeHtml([med.dosage_form, med.strength].filter(Boolean).join(' '))}</div>` : ''}
        </td>
        <td class="cell small-cell">${escapeHtml(med.dosage || '-')}</td>
        <td class="cell small-cell"><strong>${escapeHtml(formatFrequency(med))}</strong></td>
        <td class="cell instructions-cell">${escapeHtml(instructions) || '&nbsp;'}</td>
      </tr>
    `;
  }).join('');
};

export function generatePrescriptionHTML(data: PrescriptionPrintData): string {
  const {
    patientName,
    patientAge,
    patientGender,
    patientId,
    doctorName,
    doctorRegNo,
    doctorQualification,
    clinicName,
    clinicPhone,
    clinicEmail,
    clinicLogo,
    medications,
    notes,
    prescriptionDate,
  } = data;

  const logoMarkup = clinicLogo
    ? `<img class="clinic-logo" src="${escapeHtml(clinicLogo)}" alt="${escapeHtml(clinicName)} logo" />`
    : `<svg viewBox="0 0 24 24" fill="currentColor" class="clinic-icon"><path d="M7 2c0 .942-.716 1.761-1.666 2H4a2 2 0 00-2 2v6c0 1.954.512 3.824 1.455 5.467A8.04 8.04 0 005.152 21.6a2 2 0 003.545-1.574A1 1 0 0110 19h4a1 1 0 011.303 1.026 2 2 0 003.545 1.574 8.045 8.045 0 001.697-4.133C21.488 15.824 22 13.954 22 12V6a2 2 0 00-2-2h-1.334A1.914 1.914 0 0017 2v2a1 1 0 01-1 1h-8a1 1 0 01-1-1V2H7z"/></svg>`;
  const hasMedications = medications.length > 0;
  const showDoctorQualification = hasDisplayValue(doctorQualification);
  const showDoctorRegNo = hasDisplayValue(doctorRegNo);
  const showDoctorSignature = hasDisplayValue(doctorName);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription - ${escapeHtml(patientName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Source+Serif+4:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

    :root {
      --ink: #111827;
      --ink-light: #374151;
      --muted: #6b7280;
      --border-light: #e5e7eb;
      --border-dark: #d1d5db;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      color: var(--ink);
      background: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
    }

    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 48px;
    }

    /* HEADER */
    .header-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .clinic-logo {
      height: 24px;
      width: auto;
    }
    .clinic-icon {
      width: 24px;
      height: 24px;
    }
    .clinic-name {
      font-family: 'Source Serif 4', serif;
      font-size: 16pt;
      font-weight: 700;
      margin: 0;
      color: var(--ink);
    }

    .doctor-info-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }
    .doctor-name {
      font-family: 'Source Serif 4', serif;
      font-size: 28pt;
      font-weight: 700;
      margin: 0 0 8px 0;
      line-height: 1.1;
      color: var(--ink);
    }
    .doctor-qual {
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ink-light);
      margin-bottom: 4px;
    }
    .doctor-reg {
      font-size: 11pt;
      color: var(--ink-light);
    }

    .date-block {
      text-align: right;
    }
    .date-label {
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .date-value {
      font-size: 13pt;
      font-weight: 700;
      color: var(--ink);
    }

    /* DIVIDERS */
    .divider {
      height: 1px;
      background: var(--border-dark);
      margin: 0 0 24px 0;
    }
    .divider-dotted {
      border-top: 1px dashed var(--border-dark);
      margin: 32px 0;
    }

    /* PATIENT INFO */
    .patient-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .label {
      display: block;
      margin-bottom: 6px;
      color: var(--muted);
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .value {
      display: block;
      font-size: 12pt;
      font-weight: 700;
      color: var(--ink);
    }

    /* MEDICATIONS */
    .med-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border: 1px solid var(--border-light);
    }
    .med-table th,
    .med-table td {
      border: 1px solid var(--border-light);
      padding: 12px 14px;
      text-align: left;
      vertical-align: top;
    }
    .med-table th {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ink-light);
      background: #fdfdfd;
    }
    .num-cell { width: 5%; text-align: center !important; }
    .medicine-cell { width: 35%; }
    .small-cell { width: 15%; }
    .instructions-cell { width: 30%; }

    .medicine-name {
      font-weight: 700;
      font-size: 11pt;
      color: var(--ink);
    }
    .medicine-meta {
      margin-top: 4px;
      color: var(--muted);
      font-size: 9.5pt;
    }

    .legend {
      font-size: 9.5pt;
      color: var(--muted);
      font-style: italic;
      margin-bottom: 32px;
    }

    /* NOTES */
    .note-section {
      margin-top: 32px;
    }
    .note-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .note-icon {
      width: 16px;
      height: 16px;
      color: var(--ink);
    }
    .note-title {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 0;
      color: var(--ink);
    }
    .note-content {
      font-size: 10.5pt;
      color: var(--ink);
      white-space: pre-wrap;
      line-height: 1.6;
    }

    /* CONTACT / SIGNATURE */
    .footer-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 40px;
    }
    .contact-title {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 16px;
    }
    .contact-info {
      font-size: 10.5pt;
      color: var(--ink);
    }
    .contact-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .contact-icon {
      width: 14px;
      height: 14px;
      color: var(--ink);
    }

    .signature-area {
      text-align: right;
    }
    .signature-line {
      width: 220px;
      border-top: 1.5px solid var(--ink);
      margin-bottom: 8px;
    }
    .signature-name {
      font-family: 'Source Serif 4', serif;
      font-size: 13pt;
      font-weight: 700;
      color: var(--ink);
    }

    /* FOOTER */
    .footer {
      text-align: center;
      color: var(--muted);
      font-size: 8.5pt;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-top: 1px solid var(--border-light);
      padding-top: 24px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-top">
      ${logoMarkup}
      <h1 class="clinic-name">${escapeHtml(clinicName)}</h1>
    </div>

    <div class="doctor-info-container">
      <div>
        <h2 class="doctor-name">${escapeHtml(formatDoctorName(doctorName))}</h2>
        ${showDoctorQualification ? `<div class="doctor-qual">${escapeHtml(doctorQualification)}</div>` : ''}
        ${showDoctorRegNo ? `<div class="doctor-reg">Reg No: ${escapeHtml(doctorRegNo)}</div>` : ''}
      </div>
      <div class="date-block">
        <div class="date-label">Date</div>
        <div class="date-value">${escapeHtml(prescriptionDate)}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="patient-grid">
      <div>
        <span class="label">Patient Name</span>
        <span class="value">${escapeHtml(patientName)}</span>
      </div>
      <div>
        <span class="label">Age / Gender</span>
        <span class="value">${escapeHtml(patientAge || '--')} Yrs / ${escapeHtml(patientGender || '--')}</span>
      </div>
      <div>
        <span class="label">Patient ID</span>
        <span class="value">${escapeHtml(patientId || '--')}</span>
      </div>
    </div>

    <div class="divider"></div>

    ${hasMedications ? `
    <table class="med-table">
      <thead>
        <tr>
          <th class="num-cell">#</th>
          <th>Medicine Name</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${renderMedicationRows(medications)}
      </tbody>
    </table>

    <div class="legend">Legend: 1-0-1 (Morning-Lunch-Night) | SOS (As Needed)</div>
    ` : ''}

    ${notes ? `
    <div class="note-section">
      <div class="note-header">
        <svg viewBox="0 0 24 24" fill="currentColor" class="note-icon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        <h3 class="note-title">Note</h3>
      </div>
      <div class="note-content">${escapeHtml(notes)}</div>
    </div>
    ` : ''}

    <div class="divider-dotted"></div>

    <div class="footer-area">
      <div>
        <div class="contact-title">Contact Information</div>
        <div class="contact-info">
          ${clinicPhone ? `
          <div class="contact-row">
            <svg viewBox="0 0 24 24" fill="currentColor" class="contact-icon"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/></svg>
            ${escapeHtml(clinicPhone)}
          </div>
          ` : ''}
          ${clinicEmail ? `
          <div class="contact-row">
            <svg viewBox="0 0 24 24" fill="currentColor" class="contact-icon"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            ${escapeHtml(clinicEmail)}
          </div>
          ` : ''}
        </div>
      </div>

      ${showDoctorSignature ? `
      <div class="signature-area">
        <div class="signature-line"></div>
        <div class="signature-name">${escapeHtml(formatDoctorName(doctorName))}</div>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      ${escapeHtml(clinicName).toUpperCase()} &bull; PRESCRIPTION GENERATED ELECTRONICALLY
    </div>
  </div>
</body>
</html>`;
}

export function downloadPrescriptionPDF(data: PrescriptionPrintData): void {
  const html = generatePrescriptionHTML(data);
  const element = document.createElement('div');
  element.innerHTML = html;

  const opt = {
    margin: 0,
    filename: `Prescription_${data.patientName}_${data.prescriptionDate}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  html2pdf().set(opt).from(element).save();
}

export function printPrescription(data: PrescriptionPrintData): void {
  const html = generatePrescriptionHTML(data);
  const win = window.open('', '', 'width=800,height=600');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  }
}
