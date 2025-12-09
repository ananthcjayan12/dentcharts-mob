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
  templateId: InvoiceTemplateId = 'standard'
): string => {
  const fullInvoiceData = invoice as InvoiceData;
  const branding = (profile?.branding || {}) as any;
  const invoiceSettings = (profile?.invoice_settings || {}) as any;
  const basicInfo = (profile?.basic_info || {}) as any;
  const address = (profile?.address || {}) as any;

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
  const clinicAddressProps = [address.address_line1, address.address_line2, address.city, address.state, address.pincode].filter(Boolean);
  const clinicAddress = clinicAddressProps.join(', ');
  const clinicEmail = basicInfo.email;
  const clinicPhone = basicInfo.phone;
  const logoUrl = invoiceSettings.show_logo && basicInfo.logo_url ? basicInfo.logo_url : null;

  // Patient Info
  const patientName = fullInvoiceData.patient_name || fullInvoiceData.patient || 'N/A';
  const patientId = fullInvoiceData.patient_id || 'N/A';
  const patientPhone = fullInvoiceData.mobile_no;

  // Items Rows
  const itemsRows = fullInvoiceData.items && fullInvoiceData.items.length > 0
    ? fullInvoiceData.items.map((item) => `
        <tr>
          <td>
            <strong>${item.item_name || item.description}</strong>
            ${item.description && item.description !== item.item_name ? `<br><small style="color: #888;">${item.description}</small>` : ''}
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
    body { font-family: '${fontFamily}', sans-serif; padding: 40px; color: ${textColor}; -webkit-print-color-adjust: exact; }
    .invoice-container { max-width: 800px; margin: 0 auto; }
    .no-print { display: none; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      .print-button { display: none; }
    }
    .print-button { background: ${primaryColor}; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
    .print-button:hover { opacity: 0.9; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { padding: 12px; text-align: left; font-size: 14px; border-bottom: 2px solid #e5e7eb; }
    .items-table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
    .signature-section { display: flex; justify-content: flex-end; margin-top: 40px; padding-right: 20px; }
    .signature-box { text-align: center; }
    .is-paid { color: #065f46; background: #d1fae5; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; }
    .is-unpaid { color: #991b1b; background: #fee2e2; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; }
    .is-partial { color: #92400e; background: #fef3c7; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; }
  `;

  // --- Templates ---

  const standardTemplate = `
    <style>
      ${baseCss}
      .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; }
      .company-info h1 { color: ${primaryColor}; font-size: 28px; margin-bottom: 5px; }
      .invoice-info h2 { color: ${primaryColor}; font-size: 24px; margin-bottom: 10px; }
      .items-table thead { background: #f3f4f6; }
      .items-table th { color: #374151; }
      .totals-row.total { border-top: 2px solid ${primaryColor}; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: ${primaryColor}; }
      .notes { background: #f9fafb; border-left: 4px solid ${primaryColor}; padding: 15px; }
      .notes h4 { color: ${primaryColor}; margin-bottom: 5px; }
    </style>
  `;

  const modernTemplate = `
    <style>
      ${baseCss}
      body { padding: 0; }
      .invoice-container { max-width: 100%; padding: 40px; }
      .header-bg { background: ${primaryColor}; padding: 40px; margin: -40px -40px 40px -40px; color: white; display: flex; justify-content: space-between; align-items: center; }
      .header-bg h1 { margin: 0; font-size: 32px; }
      .header-bg p { color: rgba(255,255,255,0.9); }
      .invoice-details { background: white; padding: 20px; border-radius: 8px; color: #333; }
      .items-table th { text-transform: uppercase; font-size: 12px; letter-spacing: 1px; color: #888; border-bottom: 1px solid #ddd; }
      .totals-row.total { font-size: 24px; font-weight: 800; color: #333; margin-top: 20px; }
      .notes { border: 1px solid #eee; padding: 20px; border-radius: 8px; margin-top: 30px; }
      .bill-to h3 { color: ${primaryColor}; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-bottom: 10px; }
    </style>
  `;

  const minimalTemplate = `
    <style>
      ${baseCss}
      body { font-family: 'Courier New', Courier, monospace; color: black; }
      .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid black; padding-bottom: 20px; }
      .company-info h1 { font-size: 24px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 2px; }
      .items-table th { border-bottom: 1px dashed black; text-transform: uppercase; }
      .items-table td { border-bottom: 1px dashed #ccc; }
      .totals-row.total { border-top: 1px dashed black; border-bottom: 1px dashed black; font-weight: bold; padding: 15px 0; margin: 15px 0; }
      .print-button { background: black; color: white; border-radius: 0; }
      .notes { border: 1px solid black; padding: 10px; }
    </style>
  `;

  // Select CSS based on template
  const selectedCss = templateId === 'modern' ? modernTemplate : templateId === 'minimal' ? minimalTemplate : standardTemplate;

  // HTML Structure Construction
  // Note: Modern template has a different header structure
  const headerContent = templateId === 'modern'
    ? `
      <div class="header-bg">
        <div class="company-info">
          <h1>${clinicName}</h1>
          ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
          ${clinicPhone ? `<p>Phone: ${clinicPhone}</p>` : ''}
        </div>
        <div class="invoice-details">
           <h2 style="margin:0; font-size: 18px; color: #333;">INVOICE #${fullInvoiceData.invoice_id}</h2>
           <div style="margin-top: 5px; font-size: 14px;">
             ${formatDate(fullInvoiceData.posting_date)}
           </div>
        </div>
      </div>
    `
    : `
      <div class="header">
        <div class="company-info">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
          <h1>${clinicName}</h1>
          ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
          ${clinicEmail ? `<p>Email: ${clinicEmail}</p>` : ''}
          ${clinicPhone ? `<p>Phone: ${clinicPhone}</p>` : ''}
        </div>
        <div class="invoice-info" style="${templateId === 'minimal' ? 'text-align: center; margin-top: 20px;' : 'text-align: right;'}">
          <h2>INVOICE</h2>
          <p class="invoice-number">#${fullInvoiceData.invoice_id}</p>
          <p><strong>Date:</strong> ${formatDate(fullInvoiceData.posting_date)}</p>
          <p><strong>Due Date:</strong> ${formatDate(fullInvoiceData.due_date)}</p>
          <span class="${fullInvoiceData.status === 'Paid' ? 'is-paid' : fullInvoiceData.status === 'Partially Paid' ? 'is-partial' : 'is-unpaid'}">
            ${fullInvoiceData.status}
          </span>
        </div>
      </div>
    `;

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

          <div class="billing-section" style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div class="billing-box bill-to" style="width: 48%;">
              <h3>Bill To:</h3>
              <p><strong>${patientName}</strong></p>
              <p>Patient ID: ${patientId}</p>
              ${patientPhone ? `<p>Phone: ${patientPhone}</p>` : ''}
            </div>
            <div class="billing-box" style="width: 48%; ${templateId === 'minimal' ? 'text-align: right;' : ''}">
              <h3>Payment Summary:</h3>
              <p><strong>Total Amount:</strong> ${formatCurrency(fullInvoiceData.grand_total)}</p>
              <p><strong>Amount Paid:</strong> ${formatCurrency((fullInvoiceData.paid_amount || (fullInvoiceData.grand_total - fullInvoiceData.outstanding_amount)) || 0)}</p>
              <p><strong>Balance Due:</strong> ${formatCurrency(fullInvoiceData.outstanding_amount)}</p>
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
            <p>${invoiceSettings.footer_text || 'Thank you for your business!'}</p>
            <p style="font-size: 10px; margin-top: 5px;">Computer Generated Invoice</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
