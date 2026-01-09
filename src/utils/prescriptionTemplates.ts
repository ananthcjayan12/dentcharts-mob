/**
 * Prescription Print Templates
 * Generates print-friendly HTML for prescriptions
 */

// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface PrescriptionPrintMedicine {
  medicine_name: string;
  strength?: string;
  dosage_form?: string;
  morning?: number;
  lunch?: number;
  evening?: number;
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

/**
 * Generate print-friendly HTML for prescription
 * Matches the clean, medical letterhead design
 */
export function generatePrescriptionHTML(data: PrescriptionPrintData): string {
  const {
    prescriptionId,
    patientName,
    patientAge,
    patientGender,
    patientId,
    doctorName,
    doctorQualification,
    doctorRegNo,
    clinicName,
    clinicAddress,
    clinicPhone,
    clinicEmail,
    clinicLogo,
    medications,
    diagnosis,
    notes,
    prescriptionDate,
    nextAppointment
  } = data;

  // Helper to format dosage with logic to handle various formats
  const formatDosage = (med: PrescriptionPrintMedicine) => {
    if (med.morning || med.lunch || med.evening || med.night) {
      return `${med.morning || 0} - ${med.lunch || 0} - ${med.evening || 0} - ${med.night || 0}`;
    }
    return med.frequency || '-';
  };

  // Smart duration formatting to avoid "3 days days"
  const formatDuration = (days: number | string | undefined) => {
    if (!days) return '';
    const dayStr = String(days);
    if (dayStr.toLowerCase().includes('day')) return dayStr;
    return `${dayStr} Days`;
  };

  /* Logic to ensure table isn't empty (fill with blank lines for manual writing if empty) */
  const renderMedsRows = () => {
    if (medications && medications.length > 0) {
      return medications.map((med, index) => `
            <tr class="med-row">
              <td class="col-idx">${index + 1}</td>
              <td class="col-drug">
                <div class="med-name">${med.medicine_name}</div>
                ${med.strength ? `<div class="med-meta">${med.dosage_form || 'Tablet'} | ${med.strength}</div>` : ''}
              </td>
              <td class="col-dosage">${formatDosage(med)}</td>
              <td class="col-instruction">
                <div class="duration-badge">${formatDuration(med.days)}</div>
                <div class="instruction-text">${med.condition || ''}</div>
                ${med.comment ? `<div class="instruction-note">${med.comment}</div>` : ''}
              </td>
            </tr>
          `).join('');
    } else {
      // Render 4 empty rows for manual writing
      return Array(4).fill(0).map((_, i) => `
            <tr class="med-row" style="height: 45px;">
              <td class="col-idx">${i + 1}</td>
              <td class="col-drug"></td>
              <td class="col-dosage"></td>
              <td class="col-instruction"></td>
            </tr>
          `).join('');
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription - ${patientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@700&display=swap');
    
    :root {
        --primary: #111827;
        --secondary: #4b5563;
        --accent: #2563eb;
        --border: #e5e7eb;
        --bg-strip: #f9fafb;
    }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: var(--primary);
      background: #fff;
      margin: 0;
      padding: 0;
    }

    .page-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 50px;
      position: relative;
    }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      border-bottom: 3px solid var(--primary);
      padding-bottom: 20px;
    }

    .brand-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .clinic-name {
      font-family: 'Merriweather', serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }

    .clinic-details {
        font-size: 9pt;
        color: var(--secondary);
        max-width: 300px;
    }

    .doctor-card {
        text-align: right;
    }

    .dr-name {
        font-size: 16pt;
        font-weight: 700;
        margin: 0;
        color: var(--primary);
    }

    .dr-qual {
        font-size: 8pt;
        font-weight: 600;
        color: var(--secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 4px;
    }

    /* PATIENT INFO STRIP */
    .patient-strip {
        background-color: var(--bg-strip);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        margin-bottom: 30px;
    }

    .info-group {
        display: flex;
        flex-direction: column;
    }
    .info-group:first-child { flex: 1.5; }
    .info-group:nth-child(2) { flex: 0.8; text-align: center; }
    .info-group:last-child { flex: 1.2; text-align: right; }

    .info-label {
        font-size: 8px;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.8px;
        margin-bottom: 4px;
    }

    .info-value {
        font-size: 11pt;
        font-weight: 600;
        color: #000;
        white-space: nowrap; /* Prevent wrapping */
    }

    /* RX SYMBOL */
    .rx-line {
        font-family: serif;
        font-size: 24pt;
        font-weight: 700;
        font-style: italic;
        color: var(--primary);
        margin-bottom: 10px;
        margin-left: 5px;
    }

    /* TABLE */
    .med-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }

    .med-table th {
        text-align: left;
        font-size: 8pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--secondary);
        border-bottom: 2px solid #000;
        padding: 8px 10px;
    }

    .med-table td {
        padding: 12px 10px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
    }

    .col-idx { width: 30px; color: var(--secondary); font-size: 9pt; }
    .col-drug { width: 45%; }
    .col-dosage { width: 15%; font-family: monospace; font-weight: 700; font-size: 11pt; text-align: center; }
    .col-instruction { text-align: left; }

    .med-name { font-weight: 700; font-size: 11pt; color: #000; }
    .med-meta { font-size: 9pt; color: var(--secondary); margin-top: 2px; }
    .duration-badge { display: inline-block; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 8pt; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .instruction-text { font-size: 10pt; }
    .instruction-note { font-size: 9pt; font-style: italic; color: var(--secondary); }
    .legend { font-size: 8pt; color: #9ca3af; margin-top: 10px; font-style: italic; text-align: right; }

    /* DIAGNOSIS & NOTES */
    .content-block {
        margin-top: 30px;
        padding: 15px;
        background: #fff;
        border-left: 3px solid var(--border);
    }

    .block-title {
        font-size: 9pt;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--secondary);
        margin-bottom: 8px;
    }

    .block-content {
        font-size: 10.5pt;
    }

    /* FOOTER */
    .footer {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 1px solid var(--primary);
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }

    .footer-left {
        font-size: 8pt;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 1px;
        max-width: 50%;
    }

    .signature-box {
        text-align: right;
    }

    .sig-line {
        height: 40px; 
    }

    .dr-sig-name {
        font-weight: 700;
        font-size: 12pt;
    }
  </style>
</head>
<body>
  <div class="page-container">
    
    <!-- Header -->
    <header class="header">
      <div class="brand-section">
        <div class="clinic-name">${clinicName}</div>
        <div class="clinic-details">
            ${clinicAddress || ''}
            <div>${clinicPhone ? 'Phone: ' + clinicPhone : ''} ${clinicEmail ? '• ' + clinicEmail : ''}</div>
        </div>
      </div>
      
      <div class="doctor-card">
        <h1 class="dr-name">Dr. ${doctorName}</h1>
        <div class="dr-qual">
            ${doctorQualification ? `${doctorQualification}<br>` : ''}
            ${doctorRegNo ? `REG NO: ${doctorRegNo}` : ''}
        </div>
      </div>
    </header>

    <!-- Patient Info Grid -->
    <div class="patient-strip">
        <div class="info-group">
            <span class="info-label">Patient Name</span>
            <span class="info-value">${patientName}</span>
        </div>
        <div class="info-group">
            <span class="info-label">Age / Gender</span>
            <span class="info-value">${patientAge || '--'} / ${patientGender || '--'}</span>
        </div>
        <div class="info-group">
            <span class="info-label">Date : ID</span>
            <span class="info-value">${prescriptionDate} : ${patientId || 'NEW'}</span>
        </div>
    </div>

    <!-- Diagnosis Section -->
    ${diagnosis ? `
    <div style="margin-bottom: 25px;">
        <span style="font-size: 9pt; font-weight: 700; text-transform: uppercase; color: #4b5563;">Diagnosis</span>
        <div style="font-size: 11pt; margin-top: 4px;">${diagnosis}</div>
    </div>
    ` : ''}

    <div class="rx-line">Rx</div>

    <!-- Medicine Table -->
    <table class="med-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 45%;">Medicine Name & Composition</th>
          <th style="width: 20%; text-align: center;">Dosage</th>
          <th style="width: 30%;">Instruction & Duration</th>
        </tr>
      </thead>
      <tbody>
        ${renderMedsRows()}
      </tbody>
    </table>

    <div class="legend">Legend: 1-0-1 (Morn-Aft-Night) | BF: Before Food | AF: After Food</div>

    <!-- Follow Up / Notes -->
    <div style="margin-top: 40px; display: flex; gap: 40px;">
        ${notes ? `
        <div class="content-block" style="flex: 1;">
            <div class="block-title">Advice / Notes</div>
            <div class="block-content">${notes}</div>
        </div>
        ` : ''}

        ${nextAppointment ? `
        <div class="content-block" style="flex: 1; border-color: #2563eb;">
            <div class="block-title" style="color: #2563eb;">Next Follow-up</div>
            <div class="block-content" style="font-weight: 600;">${nextAppointment}</div>
        </div>
        ` : ''}
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-left">
            Generated by DentCharts<br>
            ${clinicName} • Electronic Prescription
        </div>
        <div class="signature-box">
            <!-- Space for signature -->
            <div style="height: 30px;"></div>
            <div class="dr-sig-name">Dr. ${doctorName}</div>
            <div style="font-size: 8pt; color: #6b7280;">(Authorized Signatory)</div>
        </div>
    </footer>

  </div>
</body>
</html>
    `;
}

/**
 * Download prescription as PDF using html2pdf.js
 */
export function downloadPrescriptionPDF(data: PrescriptionPrintData): void {
  const html = generatePrescriptionHTML(data);

  // Create a temporary container
  const element = document.createElement('div');
  element.innerHTML = html;

  // Basic options
  const opt = {
    margin: 0,
    filename: `Prescription_${data.patientName}_${data.prescriptionDate}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };

  // Generate PDF
  html2pdf().set(opt).from(element).save();
}

/**
 * Print prescription (Browser Print)
 */
export function printPrescription(data: PrescriptionPrintData): void {
  const html = generatePrescriptionHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
