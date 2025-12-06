import { apiClient, API_ENDPOINTS } from '../client';
import {
  CreateInvoiceRequest,
  InvoiceResponse,
  UpdatePaymentRequest,
  PaymentSummary,
  SendPaymentReminderRequest,
  PaginationParams,
  PaginatedResponse,
  InvoiceFilters,
  ApiResponse,
} from '../types';

export class PaymentService {
  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: CreateInvoiceRequest): Promise<{ invoice_id: string }> {
    try {
      const response = await apiClient.post<{ invoice_id: string }>(
        API_ENDPOINTS.PAYMENTS.CREATE_INVOICE,
        invoiceData
      );

      if (response.data && response.message === 'Invoice created successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create invoice');
    } catch (error) {
      console.error('Create invoice error:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<InvoiceResponse> {
    try {
      const response = await apiClient.get<InvoiceResponse>(
        `${API_ENDPOINTS.PAYMENTS.GET_INVOICE}?invoice_id=${invoiceId}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Invoice not found');
    } catch (error) {
      console.error('Get invoice error:', error);
      throw error;
    }
  }

  /**
   * Get list of invoices with pagination and filters
   */
  async getInvoices(
    pagination: PaginationParams = {},
    filters: InvoiceFilters = {}
  ): Promise<PaginatedResponse<InvoiceResponse>> {
    try {
      const params = new URLSearchParams({
        limit_page_length: (pagination.limit_page_length || 20).toString(),
        limit_start: (pagination.limit_start || 0).toString(),
      });

      // Add filters
      if (filters.patient_id) {
        params.append('patient_id', filters.patient_id);
      }

      if (filters.status) {
        params.append('status', filters.status);
      }

      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.PAYMENTS.LIST_INVOICES}?${params.toString()}`
      );

      // Handle the response structure: { message: { invoices: [...], total_count: N } }
      if (response.data) {
        const responseData = response.data;
        
        // Check if data has invoices array (Frappe's actual structure)
        if (responseData.invoices && Array.isArray(responseData.invoices)) {
          return {
            data: responseData.invoices,
            total_count: responseData.total_count || responseData.invoices.length,
            page_length: pagination.limit_page_length || 20,
            start: pagination.limit_start || 0,
          };
        }
        
        // Fallback to standard paginated structure
        if (responseData.data && Array.isArray(responseData.data)) {
          return responseData as PaginatedResponse<InvoiceResponse>;
        }
        
        // If data is directly an array
        if (Array.isArray(responseData)) {
          return {
            data: responseData,
            total_count: responseData.length,
            page_length: pagination.limit_page_length || 20,
            start: pagination.limit_start || 0,
          };
        }
      }

      throw new Error(response.message || 'Failed to fetch invoices');
    } catch (error) {
      console.error('Get invoices error:', error);
      throw error;
    }
  }

  /**
   * Record payment for an invoice
   */
  async recordPayment(paymentData: UpdatePaymentRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.PAYMENTS.UPDATE_PAYMENT,
        paymentData
      );

      if (response.message === 'Payment recorded successfully') {
        return response;
      }

      throw new Error(response.message || 'Failed to record payment');
    } catch (error) {
      console.error('Record payment error:', error);
      throw error;
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.PAYMENTS.DELETE_INVOICE,
        { invoice_id: invoiceId }
      );

      if (response.message === 'Invoice deleted successfully' || response.message?.includes('deleted')) {
        return response;
      }

      throw new Error(response.message || 'Failed to delete invoice');
    } catch (error) {
      console.error('Delete invoice error:', error);
      throw error;
    }
  }

  /**
   * Get payment summary for a patient
   */
  async getPaymentSummary(patientId: string): Promise<PaymentSummary> {
    try {
      const response = await apiClient.get<PaymentSummary>(
        `${API_ENDPOINTS.PAYMENTS.PAYMENT_SUMMARY}?patient_id=${patientId}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch payment summary');
    } catch (error) {
      console.error('Get payment summary error:', error);
      throw error;
    }
  }

  /**
   * Pay pending invoices for a patient (FIFO allocation across invoices)
   */
  async payPatientPendingInvoices(
    patientId: string,
    amount: number,
    mode_of_payment: string,
    payment_date?: string,
    reference_no?: string,
    reference_date?: string
  ): Promise<{ payments: any[]; remaining_amount: number } > {
    try {
      const payload = {
        patient_id: patientId,
        amount,
        mode_of_payment,
        payment_date,
        reference_no,
        reference_date,
      };

      const response = await apiClient.post<any>(API_ENDPOINTS.PAYMENTS.PAY_PENDING, payload);
      if (response.data) return response.data as { payments: any[]; remaining_amount: number };
      throw new Error(response.message || 'Failed to process pending payments');
    } catch (error) {
      console.error('Pay pending invoices error:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder to patient
   */
  async sendPaymentReminder(reminderData: SendPaymentReminderRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.PAYMENTS.SEND_REMINDER,
        reminderData
      );

      if (response.message === 'Payment reminder sent successfully') {
        return response;
      }

      throw new Error(response.message || 'Failed to send payment reminder');
    } catch (error) {
      console.error('Send payment reminder error:', error);
      throw error;
    }
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaidInvoices(patientId?: string): Promise<InvoiceResponse[]> {
    try {
      const filters: InvoiceFilters = { status: 'Unpaid' };
      if (patientId) {
        filters.patient_id = patientId;
      }

      const response = await this.getInvoices(
        { limit_page_length: 100 },
        filters
      );

      return response.data || [];
    } catch (error) {
      console.error('Get unpaid invoices error:', error);
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(patientId?: string): Promise<InvoiceResponse[]> {
    try {
      const filters: InvoiceFilters = { status: 'Overdue' };
      if (patientId) {
        filters.patient_id = patientId;
      }

      const response = await this.getInvoices(
        { limit_page_length: 100 },
        filters
      );

      return response.data || [];
    } catch (error) {
      console.error('Get overdue invoices error:', error);
      throw error;
    }
  }

  /**
   * Get patient invoices
   */
  async getPatientInvoices(patientId: string, limit: number = 20): Promise<InvoiceResponse[]> {
    try {
      const response = await this.getInvoices(
        { limit_page_length: limit },
        { patient_id: patientId }
      );

      return response.data || [];
    } catch (error) {
      console.error('Get patient invoices error:', error);
      throw error;
    }
  }

  /**
   * Calculate total invoice amount
   */
  calculateInvoiceTotal(invoice: InvoiceResponse): number {
    if (!invoice.items || invoice.items.length === 0) {
      return 0;
    }

    return invoice.items.reduce((total, item) => total + (item.qty * item.rate), 0);
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Format invoice date for display
   */
  formatInvoiceDate(invoice: InvoiceResponse): string {
    try {
      const date = new Date(invoice.posting_date);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Format due date for display
   */
  formatDueDate(invoice: InvoiceResponse): string {
    try {
      const date = new Date(invoice.due_date);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Check if invoice is overdue
   */
  isInvoiceOverdue(invoice: InvoiceResponse): boolean {
    try {
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      return today > dueDate && invoice.status !== 'Paid';
    } catch {
      return false;
    }
  }

  /**
   * Get days until due date
   */
  getDaysUntilDue(invoice: InvoiceResponse): number {
    try {
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      const timeDiff = dueDate.getTime() - today.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Get invoice status color for UI
   */
  getInvoiceStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800';
      case 'partially paid':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Validate invoice data before submission
   */
  validateInvoiceData(data: CreateInvoiceRequest): string[] {
    const errors: string[] = [];

    if (!data.patient_id) {
      errors.push('Patient ID is required');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      data.items.forEach((item, index) => {
        if (!item.item_code?.trim()) {
          errors.push(`Item ${index + 1}: Item code is required`);
        }
        if (!item.description?.trim()) {
          errors.push(`Item ${index + 1}: Description is required`);
        }
        if (item.qty <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`);
        }
      });
    }

    if (!data.posting_date) {
      errors.push('Posting date is required');
    }

    if (!data.due_date) {
      errors.push('Due date is required');
    }

    return errors;
  }

  /**
   * Generate invoice summary for display
   */
  generateInvoiceSummary(invoice: InvoiceResponse): string {
    const itemCount = invoice.items?.length || 0;
    const total = this.formatCurrency(invoice.grand_total);
    
    if (itemCount === 1) {
      return `${invoice.items[0].description} - ${total}`;
    }
    
    return `${itemCount} items - ${total}`;
  }
}

// Create singleton instance
export const paymentService = new PaymentService();