import React, { useState, useEffect, useRef } from 'react';
import { findNextAvailableSlotTime, normalizeToHHMMSS } from '../utils/slotUtils';
import { formatDateForInput } from '../utils/date';
import { useNavigate, useLocation } from 'react-router-dom';
import { queryClient, invalidateQueriesHelper } from '../api/queryClient';
import { Container, Stack, Card, Typography, Badge, Avatar, Flex, InputField, Sidebar, Button, AppointmentActions, ActionDropdown, Portal } from '../components';
import Autocomplete from '../components/common/Autocomplete';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import CreateInvoiceModal from '../components/invoices/CreateInvoiceModal';
import {
  useAppointments,
  useUpdateAppointment,
  useCancelAppointment,
  useDeleteAppointment,
  useAddToTodaysQueue,
  useAvailableSlots,
  useCheckInAppointment,
  useStartVisit,
  useCompleteVisit,
  useUpdateReviewStatus
} from '../hooks/useAppointments';
import { useCreateInvoice, useRecordPayment, usePaymentSummary, useDeleteInvoice } from '../hooks/usePayments';
import { paymentService, prescriptionService } from '../api/services';
import { usePractitioners } from '../hooks/usePractitioners';
import { usePatients, usePatientsWithSearch } from '../hooks/usePatients';
import { useClinic } from '../contexts/ClinicContext';
import { Appointment } from '../types';
import toast from 'react-hot-toast';
import { generateInvoiceHTML } from '../utils/invoiceTemplates';
import { generatePrescriptionHTML, PrescriptionPrintData } from '../utils/prescriptionTemplates';
import { generatePdfBlobFromHtml } from '../utils/printUtils';
import FileUploadModal from '../components/appointments/FileUploadModal';
import { whatsappService } from '../api/services/whatsapp';

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    resolve(result.includes(',') ? result.split(',', 2)[1] : result);
  };
  reader.onerror = () => reject(reader.error || new Error('Failed to read PDF blob'));
  reader.readAsDataURL(blob);
});

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('appointments');
  const [selectedDate, setSelectedDate] = useState(formatDateForInput());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  // Toggle to show only today's queue (default ON)
  const [showTodaysOnly, setShowTodaysOnly] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddToQueueModal, setShowAddToQueueModal] = useState(false);
  const [selectedPatientForQueue, setSelectedPatientForQueue] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const { profile } = useClinic();

  // File upload modal state
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [fileUploadAppointment, setFileUploadAppointment] = useState<any>(null);

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      toast.loading('Loading invoice details...');

      // Fetch full invoice details from API
      const fullInvoice = await paymentService.getInvoice(invoiceId);

      toast.dismiss();

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow pop-ups to view invoice');
        return;
      }

      // Generate HTML using the shared utility
      const invoiceSettings = (profile?.invoice_settings || {}) as any;
      const templateId = invoiceSettings.template_id || 'standard';

      // We need to cast fullInvoice to any because the utility expects a specific shape but our service returns a slightly different one or generic
      const invoiceHTML = generateInvoiceHTML(fullInvoice, profile, templateId);

      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    } catch (error: any) {
      toast.dismiss();
      console.error('View invoice error:', error);
      toast.error(error?.message || 'Failed to load invoice details');
    }
  };

  const handleSendInvoiceWhatsApp = async (invoiceId: string) => {
    const toastId = `wa-invoice-${invoiceId}`;
    toast.loading('Sending invoice via WhatsApp...', { id: toastId });

    try {
      const fullInvoice = await paymentService.getInvoice(invoiceId);
      const invoiceSettings = (profile?.invoice_settings || {}) as any;
      const templateId = invoiceSettings.template_id || 'standard';
      const invoiceHTML = generateInvoiceHTML(fullInvoice, profile, templateId);
      const invoiceBlob = await generatePdfBlobFromHtml(invoiceHTML, `${invoiceId}.pdf`);
      const pdfBase64 = await blobToBase64(invoiceBlob);

      const response = await whatsappService.sendInvoice(invoiceId, {
        pdfBase64,
        pdfFilename: `${invoiceId}.pdf`,
      });

      if (response.success) {
        toast.success('Invoice sent via WhatsApp', { id: toastId });
      } else {
        toast.error(response.error || 'Failed to send invoice via WhatsApp', { id: toastId });
      }
    } catch (error: any) {
      console.error('Send invoice WhatsApp error:', error);
      toast.error(error?.message || 'Failed to send invoice via WhatsApp', { id: toastId });
    }
  };

  const handleViewPrescription = (appointment: any) => {
    const patientIdentifier = appointment.patient || appointment.patient_name;
    if (!patientIdentifier) {
      toast.error('Patient not found for this appointment');
      return;
    }

    const appointmentId = appointment.name || appointment.appointment_id;
    navigate(`/prescriptions/${encodeURIComponent(patientIdentifier)}?appointmentId=${appointmentId}`, {
      state: { appointmentId }
    });
  };

  const handleSendPrescriptionWhatsApp = async (appointment: any) => {
    const patientId = appointment.patient;
    if (!patientId) {
      toast.error('Patient ID not found for this appointment');
      return;
    }

    const appointmentId = appointment.name || appointment.appointment_id;
    const toastId = `wa-rx-${appointmentId}`;
    toast.loading('Sending prescription via WhatsApp...', { id: toastId });

    try {
      const recentPrescriptions = await prescriptionService.getRecentPrescriptions(patientId, 1);
      const latestPrescription = recentPrescriptions[0];
      const prescriptionId = latestPrescription?.record_id || latestPrescription?.name;

      if (!prescriptionId) {
        toast.error('No prescription found for this patient', { id: toastId });
        return;
      }

      const fullPrescription = await prescriptionService.getPrescription(prescriptionId);
      const medications = (fullPrescription.medications || []).map((medication: any) => ({
        medicine_name: medication.drug_name || medication.medicine_name || 'Medicine',
        dosage: medication.dosage || '',
        dosage_form: medication.dosage_form || medication.form || '',
        frequency: medication.frequency || medication.interval || '',
        days: medication.period || medication.duration || '',
        condition: medication.condition || '',
        comment: medication.comment || medication.instructions || '',
      }));

      const printData: PrescriptionPrintData = {
        patientName: fullPrescription.patient_name || appointment.patient_name || 'Patient',
        patientId: fullPrescription.patient || fullPrescription.patient_id || patientId,
        patientAge: '',
        patientGender: '',
        doctorName: fullPrescription.practitioner_name || appointment.practitioner_name || 'Doctor',
        clinicName: profile?.basic_info?.clinic_name || 'Dental Clinic',
        clinicAddress: profile?.address ? `${profile.address.address_line1 || ''}, ${profile.address.city || ''}` : '',
        clinicPhone: profile?.basic_info?.phone || '',
        clinicEmail: profile?.basic_info?.email || '',
        clinicLogo: profile?.basic_info?.logo_url || '',
        medications,
        diagnosis: fullPrescription.diagnosis || '',
        notes: fullPrescription.treatment_plan || '',
        prescriptionDate: new Date(
          fullPrescription.prescription_date || fullPrescription.posting_date || new Date().toISOString()
        ).toLocaleDateString('en-GB').replace(/\//g, '-'),
        prescriptionId,
      };

      const prescriptionHTML = generatePrescriptionHTML(printData);
      const prescriptionBlob = await generatePdfBlobFromHtml(prescriptionHTML, `${prescriptionId}.pdf`);
      const pdfBase64 = await blobToBase64(prescriptionBlob);

      const response = await whatsappService.sendPrescription(prescriptionId, {
        pdfBase64,
        pdfFilename: `${prescriptionId}.pdf`,
      });

      if (response.success) {
        toast.success('Prescription sent via WhatsApp', { id: toastId });
      } else {
        toast.error(response.error || 'Failed to send prescription via WhatsApp', { id: toastId });
      }
    } catch (error: any) {
      console.error('Send prescription WhatsApp error:', error);
      toast.error(error?.message || 'Failed to send prescription via WhatsApp', { id: toastId });
    }
  };

  const [overrideQueueTime, setOverrideQueueTime] = useState('');

  // Main list search and context menu
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; appointment: any | null }>({
    visible: false,
    x: 0,
    y: 0,
    appointment: null,
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Queue View State (Moved up for scope access)
  const [queueFilter, setQueueFilter] = useState<'all' | 'booking' | 'waiting' | 'completed'>('all');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [procedureFilter, setProcedureFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { mutate: updateAppointment, isPending: isUpdating } = useUpdateAppointment();
  const { mutate: cancelAppointment, isPending: isCancelling } = useCancelAppointment();
  const { mutate: deleteAppointment, isPending: isDeleting } = useDeleteAppointment();
  const { mutate: addToQueue, isPending: isAddingToQueue } = useAddToTodaysQueue();

  // New status-based action hooks
  const { mutate: checkInAppointment } = useCheckInAppointment();
  const { mutate: startVisit } = useStartVisit();
  const { mutate: completeVisit } = useCompleteVisit();
  const { mutateAsync: updateReviewStatus } = useUpdateReviewStatus();

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, practitionerFilter, dateFrom, dateTo, procedureFilter]);

  const handleContextMenu = (e: React.MouseEvent, appointment: any) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      appointment,
    });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/home');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'new-appointment':
        navigate('/appointments/new', { state: { backgroundLocation: location } });
        break;
      default:
        break;
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    // Use patient (Frappe ID), fallback to patient_name
    const patientIdentifier = appointment.patient || appointment.patient_name;
    if (patientIdentifier) {
      const appointmentId = appointment.name || appointment.appointment_id;
      navigate(`/prescriptions/${encodeURIComponent(patientIdentifier)}?appointmentId=${appointmentId}`, {
        state: { appointmentId }
      });
    } else {
      console.error('No patient identifier found for appointment:', appointment);
    }
  };

  const handleEditAppointment = (appointment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const appointmentTime = new Date(appointment.appointment_datetime);
    setEditingAppointment({
      appointment_id: appointment.name || appointment.appointment_id,
      patient_name: appointment.patient_name,
      appointment_date: formatDateForInput(appointmentTime),
      appointment_time: appointmentTime.toTimeString().split(' ')[0].substring(0, 5),
      notes: appointment.notes || '',
      appointment_type: appointment.appointment_type || 'General Consultation',
      practitioner: appointment.practitioner,
    });
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    const type = editingAppointment.appointment_type || 'Consultation';
    updateAppointment({
      appointment_id: editingAppointment.appointment_id,
      appointment_time: editingAppointment.appointment_time + ':00',
      notes: editingAppointment.notes,
      appointment_type: type,
      type: type,
      practitioner: editingAppointment.practitioner,
      appointment_for: 'Practitioner',
    }, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingAppointment(null);
      }
    });
  };

  const handleCancelAppointment = async (appointmentId: string, appointment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    const type = appointment.appointment_type || 'Consultation';
    cancelAppointment({
      appointment_id: appointmentId,
      reason: 'Cancelled by doctor',
      appointment_type: type,
      type: type,
      practitioner: appointment.practitioner,
      appointment_for: 'Practitioner',
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = async (appointmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }

    deleteAppointment(appointmentId);
  };

  const handleAddToTodaysQueue = async () => {
    if (!selectedPatientForQueue) {
      toast.error('Please select a patient');
      return;
    }

    try {
      // Ensure we have the latest slots for the selected practitioner before computing
      let freshSlots = todaysSlots;
      if (refetchTodaysSlots) {
        try {
          const refetchResult = await refetchTodaysSlots();
          freshSlots = refetchResult?.data || todaysSlots;
        } catch (e) {
          // ignore refetch errors and fall back to whatever slots we have
          freshSlots = todaysSlots;
        }
      }

      // If user provided an explicit time override, check occupancy and include it in the payload
      const payload: any = {
        patient_id: selectedPatientForQueue,
        duration: 30,
        appointment_type: 'Consultation',
        type: 'Consultation',
        appointment_for: 'Practitioner',
      };

      if (overrideQueueTime) {
        // Attempt to find matching slot for occupancy info (slots have `time` like '09:30')
        const matched = freshSlots.find((s: any) => s.time === overrideQueueTime || s.time?.startsWith(overrideQueueTime));
        if (matched && typeof matched.existing_appointments !== 'undefined' && matched.existing_appointments > 0) {
          const ok = window.confirm(`This slot already has ${matched.existing_appointments} booking(s). Do you want to continue and add to this slot?`);
          if (!ok) return;
        }

        // Normalize overrideQueueTime to HH:MM:SS
        const normalized = normalizeToHHMMSS(overrideQueueTime);
        if (normalized) payload.appointment_time = normalized;
      }

      // If no override provided, pick the next slot after current time (DRY: use helper)
      if (!payload.appointment_time) {
        const next = findNextAvailableSlotTime(freshSlots, new Date());
        if (next) {
          const normalized = normalizeToHHMMSS(next);
          if (normalized) payload.appointment_time = normalized;
        } else {
          toast.error('No available slots found for today.');
          return;
        }
      }

      if (!payload.appointment_time) {
        toast.error('Unable to determine appointment time.');
        return;
      }

      // Debug payload + slots to help trace why server might default to 09:00
      // eslint-disable-next-line no-console
      console.debug('AddToQueue - freshSlots:', freshSlots, 'payload:', payload);

      // @ts-ignore - Extra fields for backend compatibility
      await addToQueue(payload);
      setShowAddToQueueModal(false);
      setSelectedPatientForQueue('');
      setPatientSearch('');
      setOverrideQueueTime('');
    } catch (error: any) {
      console.error('Add to queue error:', error);
    }
  };

  // New status-based action handlers
  const handleCheckIn = (appointmentId: string) => {
    checkInAppointment(appointmentId);
  };

  const handleStartVisit = (appointmentId: string) => {
    startVisit(appointmentId);
  };

  const handleCompleteVisit = (appointmentId: string) => {
    completeVisit(appointmentId);
  };

  const handleUploadFiles = (appointmentId: string, appointment?: any) => {
    setFileUploadAppointment(appointment || { name: appointmentId, patient_name: 'Patient' });
    setShowFileUploadModal(true);
  };

  const handleToggleReview = async (appointmentId: string, requested: boolean) => {
    if (!appointmentId || reviewToggleLoadingIds[appointmentId]) return;

    setReviewToggleLoadingIds((prev) => ({ ...prev, [appointmentId]: true }));

    try {
      await updateReviewStatus({ appointmentId, requested });

      // Send review request only when toggled ON.
      if (requested) {
        const toastId = `wa-review-${appointmentId}`;
        toast.loading('Sending review request via WhatsApp...', { id: toastId });

        const response = await whatsappService.sendReviewRequest(appointmentId);
        if (response.success) {
          toast.success('Review request sent via WhatsApp', { id: toastId });
        } else {
          toast.error(response.error || 'Failed to send review request', { id: toastId });
        }
      }
    } catch (error) {
      // Hook-level error handling already shows update failures.
      console.error('Review toggle flow failed:', error);
    } finally {
      setReviewToggleLoadingIds((prev) => {
        const next = { ...prev };
        delete next[appointmentId];
        return next;
      });
    }
  };

  // Invoice / Payment modal state and hooks
  const { mutate: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();
  const { mutate: recordPayment, isPending: isRecordingPayment } = useRecordPayment();
  const deleteInvoiceMutation = useDeleteInvoice();

  const [openActionMenu, setOpenActionMenu] = React.useState<string | null>(null);

  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [invoiceModalAppointment, setInvoiceModalAppointment] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    { id: '1', item_code: '', description: '', qty: 1, rate: '' }
  ]);
  const [invoiceDataState, setInvoiceDataState] = useState({
    date: formatDateForInput(),
    dueDate: formatDateForInput(),
    notes: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentAppointmentId, setPaymentAppointmentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(formatDateForInput());
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentPatientId, setPaymentPatientId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [reviewToggleLoadingIds, setReviewToggleLoadingIds] = useState<Record<string, boolean>>({});

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open create invoice modal prefilled with appointment context
  const openCreateInvoiceModal = (appointment: any) => {
    setInvoiceModalAppointment(appointment);
    setInvoiceItems([{ id: '1', item_code: '', description: '', qty: 1, rate: '' }]);
    setInvoiceDataState({ date: formatDateForInput(), dueDate: formatDateForInput(), notes: '' });
    setShowCreateInvoiceModal(true);
  };

  const addInvoiceItem = () => {
    setInvoiceItems(prev => ([...prev, { id: Date.now().toString(), item_code: '', description: '', qty: 1, rate: '' }]));
  };

  const removeInvoiceItem = (id: string) => {
    if (invoiceItems.length > 1) setInvoiceItems(prev => prev.filter(i => i.id !== id));
  };

  const updateInvoiceItem = (id: string, field: string, value: any) => {
    setInvoiceItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleCreateInvoiceSubmit = (data: any) => {
    if (!invoiceModalAppointment) {
      toast.error('No appointment selected');
      return;
    }

    // Always use the Patient doctype ID (appointment.patient), not patient_name
    const patientId = invoiceModalAppointment.patient;
    if (!patientId) {
      toast.error('Appointment has no patient ID');
      return;
    }

    // Validate items from the passed data
    const items = data.items || [];
    if (items.some((it: any) => !it.description || !it.rate || Number(it.rate) <= 0)) {
      toast.error('Please fill item description and rate');
      return;
    }

    const invoiceRequest: any = {
      patient_id: patientId,
      appointment_id: invoiceModalAppointment.name || invoiceModalAppointment.appointment_id,
      practitioner_id: data.practitioner_id || undefined,
      items: items.map(({ id, ...rest }: any) => ({ ...rest, qty: Number(rest.qty) || 1, rate: Number(rest.rate) || 0 })),
      posting_date: data.date,
      due_date: data.dueDate,
      remarks: data.notes || undefined,
      discount_amount: data.discount_amount || 0,
      tax_amount: data.tax_amount || 0,
    };

    createInvoice(invoiceRequest, {
      onSuccess: () => {
        setShowCreateInvoiceModal(false);
        setInvoiceModalAppointment(null);
        toast.success('Invoice created successfully');
      }
    });
  };

  // Payment modal handlers
  const openPaymentModal = async (invoiceId?: string, appointment?: any) => {
    setPaymentInvoiceId(invoiceId || null);
    setPaymentAppointmentId(appointment ? (appointment.name || appointment.appointment_id || null) : null);
    setPaymentAmount('');
    setPaymentMode('Cash');
    setPaymentDate(formatDateForInput());
    setPaymentReference('');
    setPaymentPatientId(null);
    setPendingAmount(null);

    if (appointment) {
      // Always use the Patient doctype ID (appointment.patient), not patient_name
      const patientId = appointment.patient;
      if (patientId) {
        setPaymentPatientId(patientId);
        try {
          const summary = await paymentService.getPaymentSummary(patientId);
          // Use pending_invoices total if available or sum unpaid invoices
          const pendingInvoices = (summary && (summary.pending_invoices || []));
          if (pendingInvoices && pendingInvoices.length > 0) {
            const totalOutstanding = pendingInvoices.reduce((s: number, inv: any) => s + (inv.outstanding_amount || inv.pending || 0), 0);
            setPendingAmount(totalOutstanding);
            setPaymentAmount(String(totalOutstanding));
          } else if (summary && typeof summary.total_pending === 'number') {
            setPendingAmount(summary.total_pending);
            setPaymentAmount(String(summary.total_pending));
          } else if (summary && typeof summary.outstanding_amount === 'number') {
            setPendingAmount(summary.outstanding_amount);
            setPaymentAmount(String(summary.outstanding_amount));
          }
        } catch (err) {
          console.warn('Failed to fetch payment summary', err);
        }
      }
    }

    setShowPaymentModal(true);
  };

  const handleRecordPaymentSubmit = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    // If invoice id present and amount fits within that invoice, record payment for that invoice
    if (paymentInvoiceId && paymentPatientId) {
      // Check if amount exceeds pending (which means user wants to pay across multiple invoices)
      if (pendingAmount !== null && amount > pendingAmount) {
        toast.error(`Payment amount cannot exceed total pending (${pendingAmount})`);
        return;
      }

      // Use FIFO payment for patient's pending invoices (handles both single and multi-invoice scenarios)
      try {
        const res = await paymentService.payPatientPendingInvoices(
          paymentPatientId,
          amount,
          paymentMode,
          paymentDate,
          paymentReference || undefined,
          paymentDate,
          paymentAppointmentId || undefined
        );
        invalidateQueriesHelper.invalidatePayments();
        invalidateQueriesHelper.invalidateDashboard();
        invalidateQueriesHelper.invalidateAppointments();
        queryClient.refetchQueries({ queryKey: ['appointments'] });
        toast.success('Payment processed successfully');
        setShowPaymentModal(false);
        setPaymentInvoiceId(null);
        setPaymentAppointmentId(null);
        setPaymentPatientId(null);
        setPendingAmount(null);
      } catch (err: any) {
        console.error('Pay pending invoices failed', err);
        toast.error(err?.message || 'Failed to process payment');
      }
      return;
    }

    // If only invoice id present (without patient context), use direct payment
    if (paymentInvoiceId) {
      try {
        await recordPayment({
          invoice_id: paymentInvoiceId,
          paid_amount: amount,
          mode_of_payment: paymentMode,
          payment_date: paymentDate,
          reference_no: paymentReference || undefined,
          reference_date: paymentDate,
        });
        setShowPaymentModal(false);
        setPaymentInvoiceId(null);
        setPaymentAppointmentId(null);
      } catch (err) {
        // hook shows error toast
      }
      return;
    }

    // Otherwise if paymentPatientId present, call pay pending invoices API (FIFO)
    if (paymentPatientId) {
      try {
        const res = await paymentService.payPatientPendingInvoices(
          paymentPatientId,
          amount,
          paymentMode,
          paymentDate,
          paymentReference || undefined,
          paymentDate,
          paymentAppointmentId || undefined
        );
        invalidateQueriesHelper.invalidatePayments();
        invalidateQueriesHelper.invalidateDashboard();
        invalidateQueriesHelper.invalidateAppointments();
        queryClient.refetchQueries({ queryKey: ['appointments'] });
        toast.success('Payments processed');
        setShowPaymentModal(false);
        setPaymentAppointmentId(null);
        setPaymentPatientId(null);
        setPendingAmount(null);
      } catch (err: any) {
        console.error('Pay pending invoices failed', err);
        toast.error(err?.message || 'Failed to process payments');
      }
      return;
    }

    toast.error('No target invoice or patient specified for payment');
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Build dynamic filters
  const appointmentFilters: any = {};
  // If "Today's Queue" toggle is enabled, override date filters to today
  const today = formatDateForInput();
  if (showTodaysOnly) {
    appointmentFilters.date_from = today;
    appointmentFilters.date_to = today;
  } else {
    if (dateFrom) appointmentFilters.date_from = dateFrom;
    if (dateTo) appointmentFilters.date_to = dateTo;
  }
  if (statusFilter && statusFilter !== 'all') appointmentFilters.status = statusFilter;
  if (practitionerFilter && practitionerFilter !== 'all') appointmentFilters.practitioner = practitionerFilter;
  if (searchTerm) appointmentFilters.search_term = searchTerm;

  // Fetch practitioners for filter dropdown
  const { data: practitionersData } = usePractitioners();
  const practitioners = practitionersData?.data || [];

  // Practitioner selected for Add-to-Queue flow
  const [selectedPractitionerForQueue, setSelectedPractitionerForQueue] = useState<string>(practitionerFilter !== 'all' ? practitionerFilter : '');

  // Set default practitioner for queue when practitioners load
  React.useEffect(() => {
    if (!selectedPractitionerForQueue && practitioners.length > 0) {
      setSelectedPractitionerForQueue(practitioners[0].name);
    }
  }, [practitioners, selectedPractitionerForQueue]);

  // Today's date for queue operations
  const todayDate = formatDateForInput();

  // Fetch today's slots when add-to-queue modal is open (used to show occupancy)
  const todaysSlotsParams: any = { date: todayDate, duration: 30 };
  if (selectedPractitionerForQueue) todaysSlotsParams.practitioner = selectedPractitionerForQueue;
  const { data: todaysSlotsData, isLoading: todaysSlotsLoading, refetch: refetchTodaysSlots } = useAvailableSlots(
    todaysSlotsParams,
    showAddToQueueModal && !!selectedPractitionerForQueue
  );
  const todaysSlots = todaysSlotsData || [];

  const { data: patientsData } = usePatientsWithSearch(patientSearch, { limit_page_length: 20 });
  const patientsList = patientsData?.data || [];

  // The daily queue view hides pagination, so it needs the full day's dataset.
  const appointmentPageLength = showTodaysOnly ? 1000 : itemsPerPage;
  const appointmentPageStart = showTodaysOnly ? 0 : (currentPage - 1) * itemsPerPage;

  // Real API data with pagination and filters
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading
  } = useAppointments(
    {
      limit_page_length: appointmentPageLength,
      limit_start: appointmentPageStart
    },
    appointmentFilters
  );

  const appointments = appointmentsData?.data || [];
  const totalCount = appointmentsData?.total_count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Grouping logic for Queue View
  const getQueueGroup = (status: string) => {
    // Map new backend statuses into the existing UI groups
    // waiting: needs action during clinic flow (waiting for visit / payment)
    const s = (status || '').toLowerCase();
    if (['waiting', 'in progress', 'pending payment'].includes(s)) return 'waiting';
    // booked: scheduled or needs invoice creation
    if (['scheduled', 'confirmed', 'open', 'to be invoiced'].includes(s)) return 'booked';
    // completed: finalised or needs file upload
    if (['completed', 'files to be uploaded'].includes(s)) return 'completed';
    return 'other';
  };

  // Sorted and filtered appointments based on sortConfig, procedureFilter, and queueFilter

  const sortedAppointments = React.useMemo(() => {
    let sortableItems = [...appointments];

    // Apply procedure filter (client-side since API may not support it)
    // Apply procedure filter (client-side since API may not support it)
    if (procedureFilter && procedureFilter !== 'all') {
      sortableItems = sortableItems.filter((apt: any) =>
        (apt.chief_complaint || '').toLowerCase().includes(procedureFilter.toLowerCase())
      );
    }

    // Apply Queue Filter (Booking/Waiting/Completed)
    if (queueFilter && queueFilter !== 'all') {
      sortableItems = sortableItems.filter((apt: any) => getQueueGroup(apt.status) === queueFilter);
    }

    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle specific keys
        if (sortConfig.key === 'appointment_datetime') {
          aValue = new Date(a.appointment_datetime).getTime();
          bValue = new Date(b.appointment_datetime).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [appointments, sortConfig, procedureFilter, queueFilter]);



  // Grouping logic for Queue View


  // Render Appointment Type with Icon
  const renderAppointmentType = (type: string) => {
    const isWalkIn = type === 'Walk In';
    return (
      <div className="flex items-center gap-2">
        {isWalkIn ? (
          <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.2L8 8v2h2.8l-1 1.9z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        <span className="text-sm font-medium text-gray-700">{type || 'Booking'}</span>
      </div>
    );
  };

  // Map status to badge classes (desktop)
  const getStatusBadgeClass = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'Pending Payment':
      case 'pending payment':
        return 'bg-red-500 text-white';
      case 'waiting':
      case 'to be invoiced':
        return 'bg-yellow-400 text-white';
      case 'in progress':
        return 'bg-blue-500 text-white';
      case 'files to be uploaded':
        return 'bg-indigo-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-400 text-white';
    }
  };

  // Map status to pill classes (mobile / subtle)
  const getStatusPillClass = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'Pending Payment':
      case 'pending payment':
        return 'bg-red-100 text-red-800';
      case 'waiting':
      case 'to be invoiced':
        return 'bg-yellow-100 text-yellow-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'files to be uploaded':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedAppointments = React.useMemo(() => {
    return {
      waiting: appointments.filter((a: any) => getQueueGroup(a.status) === 'waiting'),
      booked: appointments.filter((a: any) => getQueueGroup(a.status) === 'booked'),
      completed: appointments.filter((a: any) => getQueueGroup(a.status) === 'completed'),
    };
  }, [appointments]);

  const counts = {
    booking: groupedAppointments.booked.length,
    waiting: groupedAppointments.waiting.length,
    completed: groupedAppointments.completed.length,
  };

  const renderQueueSection = (title: string, items: any[], headerColorClass: string = 'bg-gray-100') => {
    if (items.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className={`px-4 py-3 ${headerColorClass} border-b border-gray-200 flex justify-between items-center`}>
          <h3 className="font-bold text-gray-800">{title}</h3>
          <div className="flex items-center gap-4">
            {title === 'Visit Completed' && (
              <div className="hidden"></div>
            )}
            <span className="text-sm font-bold text-gray-900">{items.length} Patients</span>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[15%]" />
              <col className="w-[23%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead className="bg-slate-700 text-xs uppercase text-white font-medium">
              <tr>
                <th className="px-4 py-3 text-left">Full Name</th>
                <th className="px-4 py-3 text-left">Procedure</th>
                <th className="px-4 py-3 text-left">Mobile Number</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
                <th className="px-4 py-3 text-left">Appointment Time</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Doctor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((appointment) => (
                <tr
                  key={appointment.name || appointment.appointment_id}
                  className="hover:bg-gray-50 cursor-pointer border-b border-gray-300 last:border-b-0"
                  onClick={() => handleAppointmentClick(appointment)}
                  onContextMenu={(e) => handleContextMenu(e, appointment)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{appointment.patient_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appointment.chief_complaint || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appointment.patient_mobile || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <ActionDropdown
                      isOpen={openActionMenu === `queue-desk-status-${appointment.name || appointment.appointment_id}`}
                      onToggle={() => setOpenActionMenu(openActionMenu === `queue-desk-status-${appointment.name || appointment.appointment_id}` ? null : `queue-desk-status-${appointment.name || appointment.appointment_id}`)}
                      onClose={() => setOpenActionMenu(null)}
                      align="left"
                      trigger={
                        <button
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${getStatusBadgeClass(appointment.status)}`}
                        >
                          {appointment.status}
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      }
                    >
                      {['Scheduled', 'Confirmed', 'To Be Invoiced', 'Pending Payment', 'Files To Be Uploaded', 'Completed', 'Cancelled', 'Waiting', 'In Progress', 'Open'].map(s => (
                        <button
                          key={s}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenu(null);
                            const apptId = appointment.name || appointment.appointment_id;
                            if (!apptId) return;
                            updateAppointment({ appointment_id: apptId, status: s } as any, {
                              onSuccess: () => {
                                toast.success('Appointment status updated');
                              }
                            });
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          {s}
                        </button>
                      ))}
                    </ActionDropdown>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {renderAppointmentActions(appointment)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(appointment.appointment_datetime).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(appointment.appointment_datetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{renderAppointmentType(appointment.appointment_type)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appointment.practitioner_name || 'Dr Avinash'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden p-3 bg-gray-50/30 space-y-3">
          {items.map((appointment) => (
            <div
              key={appointment.name || appointment.appointment_id}
              className="p-3 bg-white border border-gray-300 shadow-sm rounded-lg hover:border-primary-400 active:bg-gray-50 cursor-pointer transition-all"
              onClick={() => handleAppointmentClick(appointment)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-2">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{appointment.patient_name}</h4>
                  <p className="text-xs text-gray-500 truncate">{appointment.chief_complaint || 'General Consultation'}</p>
                  <div className="mt-1">{renderAppointmentType(appointment.appointment_type)}</div>
                </div>
                <ActionDropdown
                  isOpen={openActionMenu === `queue-mobile-status-${appointment.name || appointment.appointment_id}`}
                  onToggle={() => setOpenActionMenu(openActionMenu === `queue-mobile-status-${appointment.name || appointment.appointment_id}` ? null : `queue-mobile-status-${appointment.name || appointment.appointment_id}`)}
                  onClose={() => setOpenActionMenu(null)}
                  align="right"
                  trigger={
                    <button
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${getStatusPillClass(appointment.status)}`}
                    >
                      {appointment.status}
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  }
                >
                  {['Scheduled', 'Confirmed', 'To Be Invoiced', 'Pending Payment', 'Files To Be Uploaded', 'Completed', 'Cancelled', 'Waiting', 'In Progress', 'Open'].map(s => (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionMenu(null);
                        const apptId = appointment.name || appointment.appointment_id;
                        if (!apptId) return;
                        updateAppointment({ appointment_id: apptId, status: s } as any, {
                          onSuccess: () => {
                            toast.success('Appointment status updated');
                          }
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                </ActionDropdown>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{new Date(appointment.appointment_datetime).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(appointment.appointment_datetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="truncate max-w-[120px]">{appointment.practitioner_name || 'Dr Avinash'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                {renderAppointmentActions(appointment)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  const renderAppointmentActions = (appointment: any) => {
    const id = appointment.name || appointment.appointment_id;
    const invoiceId = appointment.invoice_id;
    const status = (appointment.status || '').toLowerCase();
    const reviewRequested = !!appointment.review_requested;
    const isReviewToggleBusy = !!reviewToggleLoadingIds[id];
    const filesMenuKey = `view-files-${id}`;

    return (
      <div className="flex items-center justify-start md:justify-center gap-1.5 flex-wrap">
        {/* New statuses handling */}
        {status === 'to be invoiced' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); openCreateInvoiceModal(appointment); }}
              className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
              <span className="hidden sm:inline">Create Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </button>
            <button
              onClick={(e) => handleCancelAppointment(id, appointment, e)}
              className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 border border-red-200 flex items-center gap-1"
            >
              Cancel
            </button>
          </>
        )}

        {status === 'pending payment' && (
          <>
            {invoiceId ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); openPaymentModal(invoiceId, appointment); }}
                  className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 border border-red-200 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12" /></svg>
                  <span className="hidden sm:inline">Make Payment</span>
                  <span className="sm:hidden">Pay</span>
                </button>

                <ActionDropdown
                  isOpen={openActionMenu === invoiceId}
                  onToggle={() => setOpenActionMenu(openActionMenu === invoiceId ? null : invoiceId)}
                  onClose={() => setOpenActionMenu(null)}
                  trigger={
                    <button
                      className="px-2 py-1 text-[10px] font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200 flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">View Invoice</span>
                      <span className="sm:hidden">View</span>
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                    </button>
                  }
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenActionMenu(null); handleViewInvoice(invoiceId); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    View Invoice
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setOpenActionMenu(null);
                      await handleSendInvoiceWhatsApp(invoiceId);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-gray-50"
                  >
                    Send via WhatsApp
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setOpenActionMenu(null);
                      if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
                      try {
                        await deleteInvoiceMutation.mutateAsync(invoiceId);
                      } catch (err) {
                        // error handled by hook
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Delete Invoice
                  </button>
                </ActionDropdown>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); openCreateInvoiceModal(appointment); }}
                  className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                  <span className="hidden sm:inline">Create Invoice</span>
                  <span className="sm:hidden">Invoice</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openPaymentModal(undefined, appointment); }}
                  className="px-2 py-1 text-[10px] font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12" /></svg>
                  <span className="hidden sm:inline">Pay Pending</span>
                  <span className="sm:hidden">Pay</span>
                </button>
              </div>
            )}
          </>
        )}

        {(status === 'files to be uploaded' || status === 'completed') && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleUploadFiles(id, appointment); }}
              className="px-2 py-1 text-[10px] font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="hidden sm:inline">Upload Files</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <ActionDropdown
              isOpen={openActionMenu === filesMenuKey}
              onToggle={() => setOpenActionMenu(openActionMenu === filesMenuKey ? null : filesMenuKey)}
              onClose={() => setOpenActionMenu(null)}
              trigger={
                <button
                  className="px-2 py-1 text-[10px] font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200 flex items-center gap-1"
                >
                  <span className="hidden sm:inline">View Files</span>
                  <span className="sm:hidden">Files</span>
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </button>
              }
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenu(null);
                  if (!invoiceId) {
                    toast.error('No invoice linked to this appointment');
                    return;
                  }
                  handleViewInvoice(invoiceId);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                View Invoice
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setOpenActionMenu(null);
                  if (!invoiceId) {
                    toast.error('No invoice linked to this appointment');
                    return;
                  }
                  await handleSendInvoiceWhatsApp(invoiceId);
                }}
                className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-gray-50"
              >
                Send Invoice
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenu(null);
                  handleViewPrescription(appointment);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                View Prescription
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setOpenActionMenu(null);
                  await handleSendPrescriptionWhatsApp(appointment);
                }}
                className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-gray-50"
              >
                Send Prescription
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setOpenActionMenu(null);
                  if (!invoiceId) {
                    toast.error('No invoice linked to this appointment');
                    return;
                  }
                  if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
                  try {
                    await deleteInvoiceMutation.mutateAsync(invoiceId);
                  } catch (err) {
                    // handled by hook
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Delete Invoice
              </button>
            </ActionDropdown>

            <div
              className={`flex items-center gap-2 ml-1 ${isReviewToggleBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isReviewToggleBusy) return;
                void handleToggleReview(id, !reviewRequested);
              }}
            >
              <label className="text-xs font-medium text-gray-600 cursor-pointer select-none">Review</label>
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${reviewRequested ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${reviewRequested ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
          </>
        )}

        {/* Fallback to existing status-based actions for other statuses */}
        {status === 'waiting' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleStartVisit(id); }}
              className="px-2 py-1 text-[10px] font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="hidden sm:inline">Start Visit</span>
              <span className="sm:hidden">Start</span>
            </button>
            <button
              onClick={(e) => handleCancelAppointment(id, appointment, e)}
              className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 border border-red-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              <span className="hidden sm:inline">Cancel Visit</span>
              <span className="sm:hidden">Cancel</span>
            </button>
          </>
        )}

        {status === 'in progress' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleCompleteVisit(id); }}
              className="px-2 py-1 text-[10px] font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="hidden sm:inline">Complete Visit</span>
              <span className="sm:hidden">Complete</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openCreateInvoiceModal(appointment); }}
              className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
            >
              <span className="hidden sm:inline">Create Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </button>
          </>
        )}

        {(status === 'scheduled' || status === 'confirmed' || status === 'open') && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleCheckIn(id); }}
              className="px-2 py-1 text-[10px] font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Check in
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                toast.loading('Sending reminder...', { id: 'wa-reminder' });
                const res = await whatsappService.sendAppointmentReminder(id);
                if (res.success) {
                  toast.success('Reminder sent via WhatsApp', { id: 'wa-reminder' });
                } else {
                  toast.error(res.error || 'Failed to send reminder', { id: 'wa-reminder' });
                }
              }}
              className="px-2 py-1 text-[10px] font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 border border-green-300 flex items-center gap-1"
              title="Send WhatsApp Reminder"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              <span className="hidden sm:inline">Remind</span>
            </button>
            <button
              onClick={(e) => handleCancelAppointment(id, appointment, e)}
              className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 border border-red-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-20">
        <TopBar
          title="Clinic Que - Today"
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4 flex-1" style={{ height: 'calc(100vh - 60px)' }}>
          <Container size="full" className="px-4 lg:px-8 py-6">
            <Stack spacing={6}>
              {/* Header Controls */}
              <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center flex-1 w-full xl:w-auto">
                  {/* Toggle Switch */}
                  <div className="flex items-center bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => setShowTodaysOnly(false)}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${!showTodaysOnly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      All Appointments
                    </button>
                    <button
                      onClick={() => setShowTodaysOnly(true)}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${showTodaysOnly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Today's Queue
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by patient name..."
                      className="block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs sm:text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-full border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  </button>

                  {/* Filter Chips - Horizontal Scroll on Mobile */}
                  <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto hide-scrollbar">
                    <button
                      onClick={() => setQueueFilter(queueFilter === 'booking' ? 'all' : 'booking')}
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${queueFilter === 'booking' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="mr-1.5">📅</span>
                      <span className="hidden sm:inline mr-1">Booking</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${queueFilter === 'booking' ? 'bg-white text-blue-500' : 'bg-blue-100 text-blue-800'}`}>
                        {counts.booking}
                      </span>
                    </button>

                    <button
                      onClick={() => setQueueFilter(queueFilter === 'waiting' ? 'all' : 'waiting')}
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${queueFilter === 'waiting' ? 'bg-yellow-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="mr-1.5">👥</span>
                      <span className="hidden sm:inline mr-1">Waiting</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${queueFilter === 'waiting' ? 'bg-white text-yellow-500' : 'bg-yellow-100 text-yellow-800'}`}>
                        {counts.waiting}
                      </span>
                    </button>

                    <button
                      onClick={() => setQueueFilter(queueFilter === 'completed' ? 'all' : 'completed')}
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${queueFilter === 'completed' ? 'bg-green-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="mr-1.5">💼</span>
                      <span className="hidden sm:inline mr-1">Completed</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${queueFilter === 'completed' ? 'bg-white text-green-500' : 'bg-green-100 text-green-800'}`}>
                        {counts.completed}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => navigate('/appointments/new', { state: { backgroundLocation: location } })}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Patients
                </button>
              </div>

              {/* Filters Section */}
              {showFilters && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Practitioner</label>
                    <select
                      value={practitionerFilter}
                      onChange={(e) => setPractitionerFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Practitioners</option>
                      {practitioners.map((p) => (
                        <option key={p.name} value={p.name}>{p.practitioner_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Statuses</option>
                      {['Scheduled', 'Confirmed', 'Waiting', 'In Progress', 'Completed', 'Cancelled', 'Pending Payment', 'To Be Invoiced', 'Files To Be Uploaded'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Procedure</label>
                    <select
                      value={procedureFilter}
                      onChange={(e) => setProcedureFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Procedures</option>
                      {['General Checkup', 'Tooth Pain', 'Cleaning', 'Root Canal', 'Extraction', 'Filling', 'Crown/Bridge', 'Orthodontics', 'Consultation', 'Follow-up'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                    <button
                      onClick={() => {
                        setPractitionerFilter('all');
                        setStatusFilter('all');
                        setProcedureFilter('all');
                        setDateFrom('');
                        setDateTo('');
                        setSearchTerm('');
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Sections */}
              <div className="space-y-6">
                {!showTodaysOnly ? (
                  // Render a single combined table for All Appointments
                  renderQueueSection('All Appointments', sortedAppointments, 'bg-gray-100')
                ) : (
                  <>
                    {(queueFilter === 'all' || queueFilter === 'waiting') && renderQueueSection('Waiting', groupedAppointments.waiting, 'bg-gray-200')}
                    {(queueFilter === 'all' || queueFilter === 'booking') && renderQueueSection('Booked', groupedAppointments.booked, 'bg-blue-100')}
                    {(queueFilter === 'all' || queueFilter === 'completed') && renderQueueSection('Visit Completed', groupedAppointments.completed, 'bg-green-100')}
                  </>
                )}

                {(!showTodaysOnly ? sortedAppointments.length === 0 : appointments.length === 0) && !appointmentsLoading && (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Typography variant="h6" className="text-gray-500">No appointments found</Typography>
                  </div>
                )}

                {/* Pagination Controls - Only show for All Appointments view */}
                {!showTodaysOnly && totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} appointments
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Stack>
          </Container>
        </div>

        {/* Edit Appointment Modal */}
        {showEditModal && editingAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <Flex align="center" justify="between" className="mb-6">
                  <Typography variant="h5" weight="bold" className="text-gray-900">
                    Edit Appointment
                  </Typography>
                  <button
                    onClick={handleCloseEditModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Flex>

                <Stack spacing={4}>
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <Typography variant="body2" weight="semibold" className="text-primary-900">
                      Patient: {editingAppointment.patient_name}
                    </Typography>
                  </div>

                  <InputField
                    label="Appointment Date"
                    type="date"
                    value={editingAppointment.appointment_date}
                    disabled
                  />

                  <InputField
                    label="Appointment Time"
                    type="time"
                    value={editingAppointment.appointment_time}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, appointment_time: e.target.value })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editingAppointment.notes}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, notes: e.target.value })}
                      placeholder="Add appointment notes..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <Flex gap={3} className="mt-6">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCloseEditModal(); }}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateAppointment(); }}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Appointment'}
                    </button>
                  </Flex>
                </Stack>
              </div>
            </div>
          </div>
        )}

        {/* Add to Today's Queue Modal */}
        {showAddToQueueModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <Flex align="center" justify="between" className="mb-6">
                  <Typography variant="h5" weight="bold" className="text-gray-900">
                    Add to Today's Queue
                  </Typography>
                  <button
                    onClick={() => {
                      setShowAddToQueueModal(false);
                      setSelectedPatientForQueue('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24  24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Flex>

                <Stack spacing={4}>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Search
                    </label>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowPatientDropdown(true);
                        if (!e.target.value) setSelectedPatientForQueue('');
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Search patient by name or ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />

                    {showPatientDropdown && patientSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {patientsList.map(patient => (
                          <button
                            type="button"
                            key={patient.name}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForQueue(patient.name);
                              setPatientSearch(patient.patient_name);
                              setShowPatientDropdown(false);
                            }}
                          >
                            <div className="font-medium text-gray-900">{patient.patient_name}</div>
                            <div className="text-xs text-gray-500">{patient.name} • {patient.mobile}</div>
                          </button>
                        ))}
                        {patientsList.length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">No patients found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Practitioner</label>
                    <select
                      value={selectedPractitionerForQueue}
                      onChange={(e) => setSelectedPractitionerForQueue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {practitioners.map((p) => (
                        <option key={p.name} value={p.name}>{p.practitioner_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Typography variant="body2" className="text-blue-900">
                      ℹ️ The system will automatically find the nearest available slot in today's queue.
                    </Typography>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Optional Time (override)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={overrideQueueTime}
                        onChange={(e) => setOverrideQueueTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {overrideQueueTime && (
                        <div className="text-sm text-gray-600">
                          {(() => {
                            const matched = todaysSlots.find((s: any) => s.time === overrideQueueTime || s.time?.startsWith(overrideQueueTime));
                            if (matched && typeof matched.existing_appointments !== 'undefined' && matched.existing_appointments > 0) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  {matched.existing_appointments} bookings
                                </span>
                              );
                            }
                            return <span className="text-xs text-gray-500">No known occupancy</span>;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patient Search Results (shown when dropdown is closed) */}
                  {patientSearch && !showPatientDropdown && (
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
                      {patientsList.length > 0 ? (
                        patientsList.map((patient) => (
                          <button
                            type="button"
                            key={patient.name}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForQueue(patient.name);
                              setPatientSearch(patient.patient_name);
                              setShowPatientDropdown(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                size="sm"
                                name={patient.patient_name}
                                className="bg-gradient-to-br from-primary-500 to-primary-600 text-white flex-shrink-0"
                              />
                              <div className="flex flex-col">
                                <Typography variant="body2" className="text-gray-900 text-sm">
                                  {patient.patient_name}
                                </Typography>
                                <Typography variant="caption" className="text-gray-500">
                                  {patient.name}
                                </Typography>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No patients found
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      variant="primary"
                      onClick={handleAddToTodaysQueue}
                      className="w-full"
                      isLoading={isAddingToQueue}
                    >
                      Add to Queue
                    </Button>
                  </div>
                </Stack>
              </div>
            </div>
          </div>
        )}
        {/* Create Invoice Modal */}
        <CreateInvoiceModal
          isOpen={showCreateInvoiceModal}
          onClose={() => setShowCreateInvoiceModal(false)}
          appointment={invoiceModalAppointment}
          completedProcedures={[]} // TODO: Pass actual completed procedures from appointment
          onSubmit={handleCreateInvoiceSubmit}
          isCreating={isCreatingInvoice}
        />


        {/* Record Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Record Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAppointmentId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice ID</label>
                  <input type="text" value={paymentInvoiceId || ''} disabled className="w-full p-2 border border-gray-300 rounded bg-gray-50" />
                </div>
                {paymentPatientId && pendingAmount !== null && (
                  <div className="p-2 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-800">
                    Pending total for patient: ₹{Number(pendingAmount).toFixed(2)}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount</label>
                  <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mode</label>
                    <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reference No</label>
                  <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
                </div>

                <div className="flex items-center justify-end gap-3 mt-3">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentAppointmentId(null);
                    }}
                    className="px-4 py-2 bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button onClick={handleRecordPaymentSubmit} className="px-4 py-2 bg-green-600 text-white rounded">{isRecordingPayment ? 'Recording...' : 'Record Payment'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.appointment && (
        <Portal>
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                setContextMenu({ ...contextMenu, visible: false });
                handleEditAppointment(contextMenu.appointment, e);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
            <button
              onClick={(e) => {
                setContextMenu({ ...contextMenu, visible: false });
                handleCancelAppointment(contextMenu.appointment.name || contextMenu.appointment.appointment_id, contextMenu.appointment, e);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </button>
            <button
              onClick={(e) => {
                setContextMenu({ ...contextMenu, visible: false });
                handleDeleteAppointment(contextMenu.appointment.name || contextMenu.appointment.appointment_id, e);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          </div>
        </Portal>
      )}

      {/* File Upload Modal */}
      {showFileUploadModal && fileUploadAppointment && (
        <FileUploadModal
          isOpen={showFileUploadModal}
          onClose={() => {
            setShowFileUploadModal(false);
            setFileUploadAppointment(null);
          }}
          referenceDoctype="Patient Appointment"
          referenceName={fileUploadAppointment.name || fileUploadAppointment.appointment_id}
          title="Upload Files"
          subtitle={fileUploadAppointment.patient_name}
        />
      )}

      <BottomNav activeTab="appointments" onTabChange={handleTabChange} />
    </div>
  );
};

export default AppointmentsPage;
