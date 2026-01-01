/**
 * Prescription Print Templates
 * Generates print-friendly HTML for prescriptions
 */

import { PrescriptionMedicine } from '../api/services/medicine';

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
    medications: PrescriptionMedicine[];
    diagnosis?: string;
    notes?: string;
    prescriptionDate: string;
}

/**
 * Generate print-friendly HTML for prescription
 * Designed as a tablet receipt format that can be shared with medical stores
 */
export function generatePrescriptionHTML(data: PrescriptionPrintData): string {
    const {
        prescriptionId,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
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
    } = data;

    // Format dosage display (e.g., "1-0-1" for morning-lunch-night)
    const formatDosage = (med: PrescriptionMedicine) => {
        return `${med.morning}-${med.lunch}-${med.evening}-${med.night}`;
    };

    const medsTableRows = medications
        .map((med, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
          <strong>${med.medicine_name}</strong>
          ${med.strength ? `<br/><span style="font-size: 11px; color: #6b7280;">${med.strength}</span>` : ''}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-family: monospace; font-weight: bold;">
          ${formatDosage(med)}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${med.days} days</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">${med.condition}</td>
      </tr>
    `)
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription - ${patientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      background: #fff;
      padding: 20px;
    }
    
    .prescription-container {
      max-width: 600px;
      margin: 0 auto;
      border: 2px solid #2563eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .clinic-logo {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .clinic-logo img {
      max-width: 50px;
      max-height: 50px;
    }
    
    .clinic-info h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .clinic-info p {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .rx-symbol {
      font-size: 32px;
      font-weight: 700;
      color: #2563eb;
      margin: 16px 20px 8px;
    }
    
    .patient-info {
      padding: 12px 20px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .patient-info .label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }
    
    .patient-info .value {
      font-weight: 500;
    }
    
    .medications-section {
      padding: 16px 20px;
    }
    
    .medications-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    .medications-table th {
      text-align: left;
      padding: 10px 8px;
      background: #f3f4f6;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      color: #4b5563;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .dosage-legend {
      padding: 12px 20px;
      background: #fef3c7;
      font-size: 11px;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .notes-section {
      padding: 12px 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .notes-section h3 {
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 4px;
    }
    
    .notes-section p {
      font-size: 13px;
      color: #374151;
    }
    
    .footer {
      padding: 16px 20px;
      border-top: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .doctor-info {
      text-align: right;
    }
    
    .doctor-info .name {
      font-weight: 600;
      font-size: 15px;
    }
    
    .doctor-info .qual {
      font-size: 12px;
      color: #6b7280;
    }
    
    .prescription-date {
      font-size: 12px;
      color: #6b7280;
    }
    
    .prescription-id {
      font-size: 11px;
      color: #9ca3af;
      font-family: monospace;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .prescription-container {
        border: 1px solid #000;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="prescription-container">
    <!-- Header -->
    <div class="header">
      ${clinicLogo ? `
        <div class="clinic-logo">
          <img src="${clinicLogo}" alt="Logo" />
        </div>
      ` : ''}
      <div class="clinic-info">
        <h1>${clinicName}</h1>
        ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
        ${clinicPhone || clinicEmail ? `<p>${[clinicPhone, clinicEmail].filter(Boolean).join(' | ')}</p>` : ''}
      </div>
    </div>
    
    <!-- Rx Symbol -->
    <div class="rx-symbol">℞</div>
    
    <!-- Patient Info -->
    <div class="patient-info">
      <div>
        <div class="label">Patient Name</div>
        <div class="value">${patientName}</div>
      </div>
      <div>
        <div class="label">Date</div>
        <div class="value">${prescriptionDate}</div>
      </div>
      ${patientAge || patientGender ? `
        <div>
          <div class="label">Age / Gender</div>
          <div class="value">${[patientAge, patientGender].filter(Boolean).join(' / ')}</div>
        </div>
      ` : ''}
      ${patientPhone ? `
        <div>
          <div class="label">Phone</div>
          <div class="value">${patientPhone}</div>
        </div>
      ` : ''}
    </div>
    
    ${diagnosis ? `
      <div class="notes-section">
        <h3>Diagnosis</h3>
        <p>${diagnosis}</p>
      </div>
    ` : ''}
    
    <!-- Medications Table -->
    <div class="medications-section">
      <table class="medications-table">
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>Medicine</th>
            <th style="text-align: center; width: 80px;">Dosage</th>
            <th style="text-align: center; width: 70px;">Duration</th>
            <th style="width: 100px;">Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${medsTableRows}
        </tbody>
      </table>
    </div>
    
    <!-- Dosage Legend -->
    <div class="dosage-legend">
      <span>ℹ️</span>
      <span><strong>Dosage format:</strong> Morning - Lunch - Evening - Night (e.g., 1-0-0-1 means 1 in morning, 1 at night)</span>
    </div>
    
    ${notes ? `
      <div class="notes-section">
        <h3>Additional Notes</h3>
        <p>${notes}</p>
      </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div>
        <div class="prescription-date">Prescribed on: ${prescriptionDate}</div>
        ${prescriptionId ? `<div class="prescription-id">ID: ${prescriptionId}</div>` : ''}
      </div>
      <div class="doctor-info">
        <div class="name">Dr. ${doctorName}</div>
        ${doctorQualification ? `<div class="qual">${doctorQualification}</div>` : ''}
        ${doctorRegNo ? `<div class="qual">Reg. No: ${doctorRegNo}</div>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Print prescription
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
        }, 250);
    }
}

/**
 * Download prescription as HTML file
 */
export function downloadPrescription(data: PrescriptionPrintData, filename?: string): void {
    const html = generatePrescriptionHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `prescription-${data.patientName.replace(/\s+/g, '-')}-${data.prescriptionDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
