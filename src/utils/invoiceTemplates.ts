import { ClinicProfile } from '../api/services/clinicProfile';

export type InvoiceTemplateId = 'standard' | 'modern' | 'minimal';

interface InvoiceItem {
  item_name?: string;
  description?: string;
  qty: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoice_id: string;
  patient?: string;
  patient_name?: string;
  patient_id?: string;
  mobile_no?: string;
  posting_date: string;
  due_date: string;
  status: string;
  items: InvoiceItem[];
  grand_total: number;
  outstanding_amount: number;
  paid_amount?: number;
  discount_amount?: number;
  total_taxes_and_charges?: number;
  remarks?: string;
}

export const invoiceTemplates = [
  { id: 'standard', name: 'Standard (Blue Accent)', description: 'Classic professional look with blue accents' },
  { id: 'modern', name: 'Modern (Clean)', description: 'Contemporary design with plenty of whitespace' },
  { id: 'minimal', name: 'Minimal (Print Friendly)', description: 'Ink-saving design optimized for black & white printing' },
];

export const generateInvoiceHTML = (
  invoice: any,
  profile: ClinicProfile | null,
  templateId: InvoiceTemplateId = 'standard',
  doctorName?: string
): string => {
  const fullInvoiceData = invoice as InvoiceData;
  const branding = (profile?.branding || {}) as any;
  const invoiceSettings = (profile?.invoice_settings || {}) as any;
  const basicInfo = (profile?.basic_info || {}) as any;
  const address = (profile?.address || {}) as any;

  // Debug logging - REMOVED

  // Defaults
  const primaryColor = branding.primary_color || '#2563eb';
  const fontFamily = branding.font_family || 'Inter';
  const textColor = branding.text_color || '#333';

  // Helper to format currency
  const formatCurrency = (amount: number) =>
    `₹${(amount || 0).toLocaleString('en-IN')}`;

  // Helper to format date
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Common Header Content
  const clinicName = basicInfo.clinic_name || 'Dental Clinic';

  // Ensure full address is constructed
  const clinicAddressProps = [
    address?.address_line1,
    address?.address_line2,
    address?.city,
    address?.state,
    address?.pincode
  ].filter(Boolean);
  const clinicAddress = clinicAddressProps.join(', ');

  const clinicEmail = basicInfo.email;
  const clinicPhone = basicInfo.phone;
  const logoUrl = invoiceSettings.show_logo && basicInfo.logo_url ? basicInfo.logo_url : null;

  // Dental Health Tips
  const dentalTips = [
    "Brush twice a day for two minutes.",
    "Floss daily to remove plaque.",
    "Visit your dentist every 6 months.",
    "Limit sugary snacks and drinks.",
    "Replace your toothbrush every 3-4 months.",
    "Use fluoride toothpaste for stronger enamel.",
    "Don't forget to brush your tongue!",
    "Drink plenty of water typically after eating."
  ];
  const randomTip = dentalTips[Math.floor(Math.random() * dentalTips.length)];
  const footerText = `Health Tip: ${randomTip}`;

  // Patient Info Extraction
  let patientName: string = fullInvoiceData.patient_name || '';
  let patientId: string = fullInvoiceData.patient_id || '';
  let patientPhone: string = fullInvoiceData.mobile_no || '';

  // Handle case where patient field is an object (as seen in user issue)
  if (typeof fullInvoiceData.patient === 'object' && fullInvoiceData.patient !== null) {
    const p = fullInvoiceData.patient as any;
    if (!patientName) patientName = p.patient_name || p.name || '';
    if (!patientId) patientId = p.patient_id || p.name || '';
    if (!patientPhone) patientPhone = p.mobile || p.mobile_no || '';
  } else if (typeof fullInvoiceData.patient === 'string') {
    // If it's just a string ID, use it if name is missing
    if (!patientName) patientName = fullInvoiceData.patient;
    if (!patientId) patientId = fullInvoiceData.patient;
  }

  patientName = patientName || 'N/A';
  patientId = patientId || 'N/A';

  // Items Rows
  const itemsRows = fullInvoiceData.items && fullInvoiceData.items.length > 0
    ? fullInvoiceData.items.map((item) => `
        <tr>
          <td>
            <strong>${item.item_name || item.description}</strong>
            ${item.description && item.description !== item.item_name ? `<br><small style="color: #64748b;">${item.description}</small>` : ''}
          </td>
          <td class="text-right">${item.qty}</td>
          <td class="text-right">${formatCurrency(item.rate)}</td>
          <td class="text-right">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="text-align: center; color: #999;">No items available</td></tr>';

  // Base CSS
  const baseCss = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: '${fontFamily}', sans-serif; color: ${textColor}; -webkit-print-color-adjust: exact; }
    .no-print { display: none; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .print-button { display: none; }
    }
    .print-button { background: ${primaryColor}; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; font-size: 14px; position: fixed; top: 20px; right: 20px; z-index: 100; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .print-button:hover { opacity: 0.9; }
    .text-right { text-align: right; }
    
    @page { margin: 0; size: auto; }
  `;

  // --- Templates ---

  // Standard Template (Updated with new variables)
  const standardTemplate = `
    <style>
      ${baseCss}
      body { padding: 40px; }
      .invoice-container { max-width: 800px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; }
      .company-info h1 { color: ${primaryColor}; font-size: 28px; margin-bottom: 5px; }
      .invoice-info h2 { color: ${primaryColor}; font-size: 24px; margin-bottom: 10px; }
      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .items-table thead { background: #f3f4f6; }
      .items-table th { padding: 12px; text-align: left; font-size: 14px; border-bottom: 2px solid #e5e7eb; color: #374151; }
      .items-table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
      .totals { margin-left: auto; width: 300px; }
      .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
      .totals-row.total { border-top: 2px solid ${primaryColor}; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: ${primaryColor}; }
      .notes { background: #f9fafb; border-left: 4px solid ${primaryColor}; padding: 15px; margin-top: 20px; }
      .notes h4 { color: ${primaryColor}; margin-bottom: 5px; }
      .billing-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
      .billing-box { width: 48%; }
      .billing-box h3 { font-size: 16px; margin-bottom: 10px; color: ${primaryColor}; }
      .signature-section { display: flex; justify-content: flex-end; margin-top: 40px; padding-right: 20px; }
      .signature-box { text-align: center; }
      .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; font-style: italic; }
    </style>
  `;

  const modernTemplate = `
    <style>
      ${baseCss}
      body { background-color: #f8fafc; padding: 40px 0; }
      .invoice-container { 
        background: white; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
        padding: 0; 
        max-width: 800px;
        margin: 0 auto;
        overflow: hidden;
      }
      .header-bg { 
        background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%); 
        padding: 40px; 
        color: white; 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start; 
      }
      .company-info h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px; }
      .company-info p { opacity: 0.9; font-size: 13px; line-height: 1.5; margin-bottom: 2px; }
      .doctor-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; opacity: 1; }
      
      .invoice-number-box {
        text-align: right;
      }
      .invoice-number-box h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; margin-bottom: 4px; }
      .invoice-number-box .big-number { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      
      .meta-grid { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 20px; 
        padding: 24px 40px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .meta-item label { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px; }
      .meta-item value { display: block; font-size: 14px; color: #0f172a; font-weight: 600; }

      .content-body { padding: 40px; }

      .billing-section { display: flex; gap: 40px; margin-bottom: 40px; }
      .bill-to { flex: 1; }
      .bill-to h3 { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
      .bill-to p { margin-bottom: 4px; color: #334155; font-size: 14px; }
      .bill-to p strong { color: #0f172a; font-size: 16px; display: block; margin-bottom: 4px; }

      .items-table { margin-bottom: 40px; width: 100%; border-collapse: collapse; }
      .items-table th { background: #f1f5f9; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; padding: 12px 16px; border: none; text-align: left; }
      .items-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; }
      .items-table tr:last-child td { border-bottom: none; }
      
      .totals { margin-left: auto; width: 320px; background: #f8fafc; padding: 24px; border-radius: 8px; }
      .totals-row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #475569; font-size: 14px; }
      .totals-row.total { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 0; }
      
      .notes { margin-top: 40px; padding: 20px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; color: #92400e; font-size: 13px; line-height: 1.5; }
      .footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-style: italic; }

      @media print {
        body { background: white; padding: 0; margin: 0; width: 100%; }
        .invoice-container { 
          box-shadow: none; 
          max-width: none; 
          width: 100%; 
          margin: 0; 
          border: none; 
          overflow: visible;
        }
        .header-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .meta-grid { background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .totals { background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .items-table th { background: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  `;

  // Minimal Template (Not heavily modified but updated structure)
  const minimalTemplate = `
    <style>
      ${baseCss}
      body { font-family: 'Courier New', Courier, monospace; color: black; padding: 40px; }
      .invoice-container { max-width: 800px; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid black; padding-bottom: 20px; }
      .company-info h1 { font-size: 24px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 2px; }
      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .items-table th { border-bottom: 1px dashed black; text-transform: uppercase; padding: 10px; text-align: left; }
      .items-table td { border-bottom: 1px dashed #ccc; padding: 10px; }
      .items-table td.text-right, .items-table th.text-right { text-align: right; }
      .totals { margin-left: auto; width: 300px; }
      .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
      .totals-row.total { border-top: 1px dashed black; border-bottom: 1px dashed black; font-weight: bold; padding: 15px 0; margin: 15px 0; }
      .notes { border: 1px solid black; padding: 10px; margin-top: 20px; }
      .billing-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .billing-box { width: 48%; }
    </style>
  `;

  // Select CSS based on template
  const selectedCss = templateId === 'modern' ? modernTemplate : templateId === 'minimal' ? minimalTemplate : standardTemplate;

  const isOutstanding = fullInvoiceData.outstanding_amount > 0;

  // HTML Structure Construction
  const headerContent = templateId === 'modern'
    ? `
      <div class="header-bg">
        <div class="company-info">
          <h1>${clinicName}</h1>
          ${doctorName ? `<div class="doctor-name">${doctorName}</div>` : ''}
          ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
          ${clinicPhone ? `<p>Phone: ${clinicPhone}</p>` : ''}
          ${clinicEmail ? `<p>${clinicEmail}</p>` : ''}
        </div>
        <div class="invoice-number-box">
           <h2>Invoice #</h2>
           <div class="big-number">${fullInvoiceData.invoice_id}</div>
           <div style="margin-top: 6px;">
             <span class="status-badge" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">
               ${fullInvoiceData.status}
             </span>
           </div>
        </div>
      </div>
      
      <div class="meta-grid">
        <div class="meta-item">
          <label>Date Issued</label>
          <value>${formatDate(fullInvoiceData.posting_date)}</value>
        </div>
        ${isOutstanding ? `
        <div class="meta-item">
          <label>Due Date</label>
          <value>${formatDate(fullInvoiceData.due_date)}</value>
        </div>
        <div class="meta-item">
          <label>Amount Due</label>
          <value>${formatCurrency(fullInvoiceData.outstanding_amount)}</value>
        </div>
        ` : `
        <div class="meta-item">
          <label>Total Amount</label>
          <value>${formatCurrency(fullInvoiceData.grand_total)}</value>
        </div>
        `}
      </div>
    `
    : `
      <div class="header">
        <div class="company-info">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
          <h1>${clinicName}</h1>
          ${doctorName ? `<p style="font-weight: bold; margin-bottom: 5px;">${doctorName}</p>` : ''}
          ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
          ${clinicEmail ? `<p>Email: ${clinicEmail}</p>` : ''}
          ${clinicPhone ? `<p>Phone: ${clinicPhone}</p>` : ''}
        </div>
        <div class="invoice-info" style="${templateId === 'minimal' ? 'text-align: center; margin-top: 20px;' : 'text-align: right;'}">
          <h2>INVOICE</h2>
          <p class="invoice-number">#${fullInvoiceData.invoice_id}</p>
          <p><strong>Date:</strong> ${formatDate(fullInvoiceData.posting_date)}</p>
          ${isOutstanding && fullInvoiceData.due_date ? `<p><strong>Due Date:</strong> ${formatDate(fullInvoiceData.due_date)}</p>` : ''}
          <p><strong>Status:</strong> ${fullInvoiceData.status}</p>
        </div>
      </div>
    `;

  if (templateId === 'modern') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${fullInvoiceData.invoice_id}</title>
          ${selectedCss}
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">🖨️ Print Invoice</button>
          
          <div class="invoice-container">
            ${headerContent}
            
            <div class="content-body">
              ${invoiceSettings.header_text ? `<div style="margin-bottom: 30px; font-size: 14px; text-align: center; color: #64748b; font-style: italic;">${invoiceSettings.header_text}</div>` : ''}

              <div class="billing-section">
                <div class="bill-to">
                  <h3>Bill To</h3>
                  <p><strong>${patientName}</strong></p>
                  <p>ID: ${patientId}</p>
                  ${patientPhone ? `<p>${patientPhone}</p>` : ''}
                </div>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <div class="totals">
                <div class="totals-row subtotal">
                  <span>Subtotal</span>
                  <span>${formatCurrency(fullInvoiceData.grand_total)}</span>
                </div>
                ${fullInvoiceData.discount_amount && fullInvoiceData.discount_amount > 0 ? `
                <div class="totals-row">
                  <span>Discount</span>
                  <span>-${formatCurrency(fullInvoiceData.discount_amount)}</span>
                </div>` : ''}
                 ${fullInvoiceData.total_taxes_and_charges && fullInvoiceData.total_taxes_and_charges > 0 ? `
                <div class="totals-row">
                  <span>Tax</span>
                  <span>${formatCurrency(fullInvoiceData.total_taxes_and_charges)}</span>
                </div>` : ''}
                <div class="totals-row total">
                  <span>Total Amount</span>
                  <span>${formatCurrency(fullInvoiceData.grand_total)}</span>
                </div>
                <div class="totals-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 13px;">
                  <span>Amount Paid</span>
                  <span>${formatCurrency((fullInvoiceData.paid_amount || (fullInvoiceData.grand_total - fullInvoiceData.outstanding_amount)) || 0)}</span>
                </div>
                ${isOutstanding ? `
                <div class="totals-row" style="font-size: 13px; font-weight: 600; color: #ef4444;">
                  <span>Balance Due</span>
                  <span>${formatCurrency(fullInvoiceData.outstanding_amount)}</span>
                </div>
                ` : ''}
              </div>

              ${fullInvoiceData.remarks && fullInvoiceData.remarks !== 'No Remarks' ? `
                <div class="notes">
                  <h4 style="margin-bottom: 5px; font-weight: 700;">Notes</h4>
                  <p>${fullInvoiceData.remarks}</p>
                </div>
              ` : ''}

              ${invoiceSettings.terms_conditions ? `
                <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                  <h4 style="text-transform: uppercase;">Terms & Conditions</h4>
                  <p>${invoiceSettings.terms_conditions}</p>
                </div>
              ` : ''}

              <div class="signature-section">
                ${invoiceSettings.show_seal && invoiceSettings.seal_url ? `
                  <div style="margin-right: 20px;">
                    <img src="${invoiceSettings.seal_url}" alt="Seal" style="max-height: 80px; opacity: 0.8;">
                  </div>
                ` : ''}
                 ${invoiceSettings.signature_url ? `
                  <div class="signature-box">
                    <img src="${invoiceSettings.signature_url}" alt="Signature" style="max-height: 60px; margin-bottom: 5px;">
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Authorized Signatory</p>
                  </div>
                ` : ''}
              </div>
              
              <div class="footer">
                <p>🦷 ${footerText}</p>
                 ${!clinicAddress ? '<!-- Address missing in profile -->' : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Fallback for Standard and Minimal templates (Original structure maintained but improved)
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${fullInvoiceData.invoice_id}</title>
        ${selectedCss}
      </head>
      <body>
        <div class="invoice-container">
          <button class="print-button no-print" onclick="window.print()">🖨️ Print Invoice</button>
          
          ${headerContent}

          ${invoiceSettings.header_text ? `<div style="margin-bottom: 20px; font-size: 14px; text-align: center; color: #666;">${invoiceSettings.header_text}</div>` : ''}

          <div class="billing-section">
            <div class="billing-box bill-to">
              <h3>Bill To:</h3>
              <p><strong>${patientName}</strong></p>
              <p>Patient ID: ${patientId}</p>
              ${patientPhone ? `<p>Phone: ${patientPhone}</p>` : ''}
            </div>
            <div class="billing-box" style="${templateId === 'minimal' ? 'text-align: right;' : ''}">
              <h3>Payment Summary:</h3>
              <p><strong>Total Amount:</strong> ${formatCurrency(fullInvoiceData.grand_total)}</p>
              <p><strong>Amount Paid:</strong> ${formatCurrency((fullInvoiceData.paid_amount || (fullInvoiceData.grand_total - fullInvoiceData.outstanding_amount)) || 0)}</p>
              ${isOutstanding ? `<p><strong>Balance Due:</strong> ${formatCurrency(fullInvoiceData.outstanding_amount)}</p>` : ''}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row subtotal">
              <span>Subtotal:</span>
              <span>${formatCurrency(fullInvoiceData.grand_total)}</span>
            </div>
            ${fullInvoiceData.discount_amount && fullInvoiceData.discount_amount > 0 ? `
            <div class="totals-row">
              <span>Discount:</span>
              <span>-${formatCurrency(fullInvoiceData.discount_amount)}</span>
            </div>` : ''}
             ${fullInvoiceData.total_taxes_and_charges && fullInvoiceData.total_taxes_and_charges > 0 ? `
            <div class="totals-row">
              <span>Tax:</span>
              <span>${formatCurrency(fullInvoiceData.total_taxes_and_charges)}</span>
            </div>` : ''}
            <div class="totals-row total">
              <span>Total Amount:</span>
              <span>${formatCurrency(fullInvoiceData.grand_total)}</span>
            </div>
          </div>

          ${fullInvoiceData.remarks && fullInvoiceData.remarks !== 'No Remarks' ? `
            <div class="notes">
              <h4>Notes:</h4>
              <p>${fullInvoiceData.remarks}</p>
            </div>
          ` : ''}

          ${invoiceSettings.terms_conditions ? `
            <div style="margin-top: 30px; font-size: 12px; color: #666;">
              <h4>Terms & Conditions:</h4>
              <p>${invoiceSettings.terms_conditions}</p>
            </div>
          ` : ''}

          <div class="signature-section">
            ${invoiceSettings.show_seal && invoiceSettings.seal_url ? `
              <div style="margin-right: 20px;">
                <img src="${invoiceSettings.seal_url}" alt="Seal" style="max-height: 80px; opacity: 0.8;">
              </div>
            ` : ''}
             ${invoiceSettings.signature_url ? `
              <div class="signature-box">
                <img src="${invoiceSettings.signature_url}" alt="Signature" style="max-height: 60px; margin-bottom: 5px;">
                <p>Authorized Signatory</p>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>🦷 ${footerText}</p>
            <p style="font-size: 10px; margin-top: 5px;">Computer Generated Invoice</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
