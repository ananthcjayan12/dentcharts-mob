import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sidebar } from '../components';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import Typography from '../components/common/Typography';
import Stack from '../components/layout/Stack';
import Flex from '../components/layout/Flex';
import DentalChart, { ToothData } from '../components/common/DentalChart';
import { usePatient } from '../hooks/usePatients';
import { usePatientPrescriptions, useCreatePrescription, useUpdatePrescription } from '../hooks/usePrescriptions';
import { usePatientInvoices, usePaymentSummary, useRecordPayment, useDeleteInvoice } from '../hooks/usePayments';
import { fileUploadService } from '../api/services/fileUpload';
import toast from 'react-hot-toast';

// Get API base URL from environment variable (same as API client)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://dev2.localhost:8800';

/**
 * Compress image file to reduce size
 * @param file - Original image file
 * @param maxWidth - Maximum width (default 1920px)
 * @param maxHeight - Maximum height (default 1920px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 */
const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
    };
    
    reader.onerror = () => reject(new Error('FileReader failed'));
  });
};

const PrescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId: rawPatientId } = useParams<{ patientId: string }>();
  
  // Decode the patientId from URL (e.g., "Ananth.C%20Jayan" -> "Ananth.C Jayan")
  const patientId = rawPatientId ? decodeURIComponent(rawPatientId) : undefined;
  
  // Get appointment ID from location state or query params
  const appointmentId = location.state?.appointmentId || new URLSearchParams(location.search).get('appointmentId');
  
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [currentSection, setCurrentSection] = useState<'medical' | 'payments' | 'dental-chart'>('medical');
  const [dentalChartData, setDentalChartData] = useState<Record<number, ToothData>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileCategory, setFileCategory] = useState('report');
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFileCategory, setSelectedFileCategory] = useState<string>('all');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    chief_complaint: '',
    symptoms: '',
    diagnosis: '',
    treatment_plan: '',
    medications: [{ drug_code: '', drug_name: '', dosage: '', period: '', dosage_form: 'Tablet', interval: '', comment: '' }],
    investigations: [{ lab_test_code: '', lab_test_name: '', lab_test_comment: '' }],
  });

  // API hooks
  const { data: patient, isLoading: patientLoading } = usePatient(patientId || '', !!patientId);
  const { data: prescriptions, isLoading: prescriptionsLoading, refetch: refetchPrescriptions } = usePatientPrescriptions(patientId || '');
  const { data: invoices, isLoading: invoicesLoading } = usePatientInvoices(patientId || '');
  const { data: paymentSummary, isLoading: paymentSummaryLoading } = usePaymentSummary(patientId || '');
  
  // Use pending_invoices from payment summary if invoices are not available
  const displayInvoices = React.useMemo(() => {
    if (invoices && invoices.length > 0) return invoices;
    if (paymentSummary?.pending_invoices) return paymentSummary.pending_invoices;
    return [];
  }, [invoices, paymentSummary]);
  
  const { mutate: createPrescription, isPending: isCreating } = useCreatePrescription();
  const { mutate: updatePrescription, isPending: isUpdating } = useUpdatePrescription();
  const { mutate: recordPayment, isPending: isPaymentProcessing } = useRecordPayment();
  const deleteInvoiceMutation = useDeleteInvoice();

  const isLoading = patientLoading || prescriptionsLoading || invoicesLoading || paymentSummaryLoading;

  // Parse medical_history JSON from patient (if present)
  const medicalHistory = React.useMemo(() => {
    const raw = (patient as any)?.medical_history;
    if (!patient || !raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
      console.warn('Failed to parse medical_history for patient', err);
      return null;
    }
  }, [patient]);

  // Local state for UI interactions
  const [expandedPrescriptions, setExpandedPrescriptions] = useState<Set<string>>(new Set());
  const [editablePrescriptions, setEditablePrescriptions] = useState<Set<string>>(new Set());
  const [editedPrescriptionData, setEditedPrescriptionData] = useState<Record<string, any>>({});
  const [detailedPrescriptions, setDetailedPrescriptions] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [invoiceDetails, setInvoiceDetails] = useState<Record<string, any>>({});
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState<Set<string>>(new Set());

  // Fetch patient files when component mounts or patientId changes
  React.useEffect(() => {
    const fetchPatientFiles = async () => {
      if (!patientId) return;
      
      setIsLoadingFiles(true);
      try {
        const files = await fileUploadService.getPatientFiles(patientId);
        
        // If we have an appointment ID, also fetch files linked to the appointment
        if (appointmentId) {
          try {
            const appointmentFiles = await fileUploadService.listFiles({
              reference_doctype: 'Patient Appointment',
              reference_name: appointmentId,
              limit: 100
            });
            setPatientFiles([...files, ...appointmentFiles]);
          } catch (e) {
            console.warn('Failed to fetch appointment files', e);
            setPatientFiles(files);
          }
        } else {
          setPatientFiles(files);
        }
      } catch (error) {
        console.error('Error fetching patient files:', error);
        toast.error('Failed to load patient files');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchPatientFiles();
  }, [patientId, appointmentId]);

  // Filter files based on selected category
  const filteredFiles = React.useMemo(() => {
    if (selectedFileCategory === 'all') {
      return patientFiles;
    }
    return patientFiles.filter((file: any) => file.file_category === selectedFileCategory);
  }, [patientFiles, selectedFileCategory]);

  // Get unique categories from files
  const fileCategories = React.useMemo(() => {
    const categories = new Set(patientFiles.map((file: any) => file.file_category).filter(Boolean));
    return Array.from(categories);
  }, [patientFiles]);

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/home');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'appointments':
        navigate('/appointments');
        break;
      case 'new-appointment':
        navigate('/appointments/new', { state: { backgroundLocation: location } });
        break;
      default:
        break;
    }
  };

  const togglePrescription = async (recordId: string) => {
    const isExpanded = expandedPrescriptions.has(recordId);
    
    if (isExpanded) {
      // If already expanded, just collapse it
      setExpandedPrescriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    } else {
      // If not expanded, fetch details and then expand
      if (!detailedPrescriptions[recordId]) {
        // Only fetch if we don't have the details yet
        setLoadingDetails(prev => new Set(prev).add(recordId));
        try {
          const { prescriptionService } = await import('../api/services');
          const details = await prescriptionService.getPrescription(recordId);
          setDetailedPrescriptions(prev => ({ ...prev, [recordId]: details }));
        } catch (error) {
          console.error('Error fetching prescription details:', error);
          toast.error('Failed to load prescription details');
          return;
        } finally {
          setLoadingDetails(prev => {
            const newSet = new Set(prev);
            newSet.delete(recordId);
            return newSet;
          });
        }
      }
      
      // Expand after fetching
      setExpandedPrescriptions(prev => new Set(prev).add(recordId));
    }
  };

  const toggleEdit = async (recordId: string) => {
    setEditablePrescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
        // Clear edited data when closing edit mode
        setEditedPrescriptionData(prevData => {
          const newData = { ...prevData };
          delete newData[recordId];
          return newData;
        });
      } else {
        newSet.add(recordId);
        
        // Auto-expand when entering edit mode
        if (!expandedPrescriptions.has(recordId)) {
          // Fetch details if not already fetched
          if (!detailedPrescriptions[recordId]) {
            setLoadingDetails(prevLoading => new Set(prevLoading).add(recordId));
            (async () => {
              try {
                const { prescriptionService } = await import('../api/services');
                const details = await prescriptionService.getPrescription(recordId);
                setDetailedPrescriptions(prev => ({ ...prev, [recordId]: details }));
                
                // Initialize edited data with fetched details
                setEditedPrescriptionData(prevData => ({
                  ...prevData,
                  [recordId]: {
                    chief_complaint: details.chief_complaint || '',
                    symptoms: details.symptoms || '',
                    diagnosis: details.diagnosis || '',
                    treatment_plan: details.treatment_plan || '',
                    status: details.status || 'Active',
                  },
                }));
              } catch (error) {
                console.error('Error fetching prescription details:', error);
                toast.error('Failed to load prescription details');
              } finally {
                setLoadingDetails(prevLoading => {
                  const newSet = new Set(prevLoading);
                  newSet.delete(recordId);
                  return newSet;
                });
              }
            })();
          } else {
            // Use existing detailed data
            const displayData = detailedPrescriptions[recordId];
            setEditedPrescriptionData(prevData => ({
              ...prevData,
              [recordId]: {
                chief_complaint: displayData.chief_complaint || '',
                symptoms: displayData.symptoms || '',
                diagnosis: displayData.diagnosis || '',
                treatment_plan: displayData.treatment_plan || '',
                status: displayData.status || 'Active',
              },
            }));
          }
          setExpandedPrescriptions(prev => new Set(prev).add(recordId));
        } else {
          // Already expanded, just initialize edit data
          const detailedData = detailedPrescriptions[recordId];
          const prescription = prescriptions?.find((p: any) => (p.name || p.record_id) === recordId);
          const displayData = detailedData || prescription;
          if (displayData) {
            setEditedPrescriptionData(prevData => ({
              ...prevData,
              [recordId]: {
                chief_complaint: displayData.chief_complaint || '',
                symptoms: displayData.symptoms || '',
                diagnosis: displayData.diagnosis || '',
                treatment_plan: displayData.treatment_plan || '',
                status: displayData.status || 'Active',
              },
            }));
          }
        }
      }
      return newSet;
    });
  };

  const handleSavePrescription = async (recordId: string) => {
    const editedData = editedPrescriptionData[recordId];
    if (!editedData) return;

    try {
      await updatePrescription({
        record_id: recordId,
        ...editedData,
      });
      // Close edit mode after successful update
      toggleEdit(recordId);
    } catch (error: any) {
      console.error('Update prescription error:', error);
    }
  };

  const handlePrescriptionFieldChange = (recordId: string, field: string, value: any) => {
    setEditedPrescriptionData(prevData => ({
      ...prevData,
      [recordId]: {
        ...prevData[recordId],
        [field]: value,
      },
    }));
  };

  const handleDeletePrescription = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;

    try {
      const { prescriptionService } = await import('../api/services');
      await prescriptionService.deletePrescription(recordId);
      toast.success('Prescription deleted successfully');
      
      // Refresh prescriptions list
      await refetchPrescriptions();
      
      // Clean up state
      setExpandedPrescriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
      setEditablePrescriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
      setEditedPrescriptionData(prev => {
        const newData = { ...prev };
        delete newData[recordId];
        return newData;
      });
      setDetailedPrescriptions(prev => {
        const newData = { ...prev };
        delete newData[recordId];
        return newData;
      });
    } catch (error: any) {
      console.error('Delete prescription error:', error);
      toast.error(error?.message || 'Failed to delete prescription');
    }
  };

  const handleNewAppointment = () => {
    // Navigate to new appointment page with patient ID pre-filled
    navigate(`/appointments/new?patientId=${patientId}`, { state: { backgroundLocation: location } });
  };

  const handleCreatePrescription = async () => {
    if (!patientId) return;

    // Validation
    if (!newPrescription.chief_complaint.trim()) {
      toast.error('Please enter chief complaint');
      return;
    }
    if (!newPrescription.diagnosis.trim()) {
      toast.error('Please enter diagnosis');
      return;
    }
    if (!newPrescription.treatment_plan.trim()) {
      toast.error('Please enter treatment plan');
      return;
    }

    try {
      const prescriptionData: any = {
        patient_id: patientId,
        appointment_id: appointmentId,
        chief_complaint: newPrescription.chief_complaint,
        symptoms: newPrescription.symptoms,
        diagnosis: newPrescription.diagnosis,
        treatment_plan: newPrescription.treatment_plan,
        medications: newPrescription.medications.filter(m => m.drug_name.trim()),
        investigations: newPrescription.investigations.filter(i => i.lab_test_name.trim()),
      };

      await createPrescription(prescriptionData);
      
      // Manually refetch prescriptions to ensure UI updates
      await refetchPrescriptions();
      
      // Reset form and close modal
      setNewPrescription({
        chief_complaint: '',
        symptoms: '',
        diagnosis: '',
        treatment_plan: '',
        medications: [{ drug_code: '', drug_name: '', dosage: '', period: '', dosage_form: 'Tablet', interval: '', comment: '' }],
        investigations: [{ lab_test_code: '', lab_test_name: '', lab_test_comment: '' }],
      });
      setShowNewPrescriptionModal(false);
    } catch (error: any) {
      console.error('Create prescription error:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileUploadService.deleteFile(fileId);
      toast.success('File deleted successfully');
      
      // Refresh patient files list
      const files = await fileUploadService.getPatientFiles(patientId || '');
      
      if (appointmentId) {
        try {
          const appointmentFiles = await fileUploadService.listFiles({
            reference_doctype: 'Patient Appointment',
            reference_name: appointmentId,
            limit: 100
          });
          setPatientFiles([...files, ...appointmentFiles]);
        } catch (e) {
          setPatientFiles(files);
        }
      } else {
        setPatientFiles(files);
      }
    } catch (error: any) {
      console.error('Delete file error:', error);
      toast.error(error?.message || 'Failed to delete file');
    }
  };

  const addMedication = () => {
    setNewPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { drug_code: '', drug_name: '', dosage: '', period: '', dosage_form: 'Tablet', interval: '', comment: '' }],
    }));
  };

  const removeMedication = (index: number) => {
    setNewPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const addInvestigation = () => {
    setNewPrescription(prev => ({
      ...prev,
      investigations: [...prev.investigations, { lab_test_code: '', lab_test_name: '', lab_test_comment: '' }],
    }));
  };

  const removeInvestigation = (index: number) => {
    setNewPrescription(prev => ({
      ...prev,
      investigations: prev.investigations.filter((_, i) => i !== index),
    }));
  };

  // File upload handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      // Compress images before adding to state
      const processedFiles = await Promise.all(
        fileArray.map(async (file) => {
          if (file.type.startsWith('image/')) {
            try {
              const originalSize = (file.size / 1024 / 1024).toFixed(2);
              // Browser file selection: max 1920px, 80% quality
              const compressed = await compressImage(file, 1920, 1920, 0.8);
              const compressedSize = (compressed.size / 1024 / 1024).toFixed(2);
              console.log(`Compressed ${file.name}: ${originalSize}MB → ${compressedSize}MB`);
              return compressed;
            } catch (error) {
              console.error('Image compression failed, using original:', error);
              return file;
            }
          }
          return file;
        })
      );
      
      setSelectedFiles(prev => [...prev, ...processedFiles]);
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      // Compress camera images more aggressively (mobile photos are large)
      const processedFiles = await Promise.all(
        fileArray.map(async (file) => {
          if (file.type.startsWith('image/')) {
            try {
              const originalSize = (file.size / 1024 / 1024).toFixed(2);
              // Camera capture: max 1280px, 70% quality (mobile photos are typically high-res)
              const compressed = await compressImage(file, 1280, 1280, 0.7);
              const compressedSize = (compressed.size / 1024 / 1024).toFixed(2);
              console.log(`Camera compressed ${file.name}: ${originalSize}MB → ${compressedSize}MB`);
              return compressed;
            } catch (error) {
              console.error('Camera image compression failed, using original:', error);
              return file;
            }
          }
          return file;
        })
      );
      
      setSelectedFiles(prev => [...prev, ...processedFiles]);
    }
  };

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment'); // Use rear camera on mobile (iOS compatible)
    input.onchange = (e: any) => handleCameraCapture(e);
    input.click();
  };

  const handleUploadFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf,.doc,.docx';
    input.onchange = (e: any) => handleFileSelect(e);
    input.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveReport = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = selectedFiles.map(file =>
        fileUploadService.uploadFile(file, {
          file_category: fileCategory,
          description: uploadNotes || `${fileCategory} uploaded on ${uploadDate}`,
          reference_doctype: appointmentId ? 'Patient Appointment' : 'Patient',
          reference_name: appointmentId || patientId || '',
          is_private: true,
        })
      );

      const results = await Promise.all(uploadPromises);
      
      setUploadedFiles(prev => [...prev, ...results]);
      toast.success(`Successfully uploaded ${results.length} file(s)`);
      
      // Refresh patient files list
      const files = await fileUploadService.getPatientFiles(patientId || '');
      
      if (appointmentId) {
        try {
          const appointmentFiles = await fileUploadService.listFiles({
            reference_doctype: 'Patient Appointment',
            reference_name: appointmentId,
            limit: 100
          });
          setPatientFiles([...files, ...appointmentFiles]);
        } catch (e) {
          setPatientFiles(files);
        }
      } else {
        setPatientFiles(files);
      }
      
      // Reset state
      setSelectedFiles([]);
      setUploadNotes('');
      setShowUpload(false);
      setFileCategory('report');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.outstanding_amount?.toString() || invoice.pending?.toString() || '');
    setShowPaymentModal(true);
  };

  const toggleInvoiceExpansion = async (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices);
    
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
      setExpandedInvoices(newExpanded);
    } else {
      newExpanded.add(invoiceId);
      setExpandedInvoices(newExpanded);
      
      // Fetch invoice details if not already loaded
      if (!invoiceDetails[invoiceId]) {
        setLoadingInvoiceDetails(new Set(loadingInvoiceDetails).add(invoiceId));
        
        try {
          const { paymentService } = await import('../api/services');
          const details = await paymentService.getInvoice(invoiceId);
          
          setInvoiceDetails(prev => ({
            ...prev,
            [invoiceId]: details,
          }));
        } catch (error: any) {
          console.error('Error fetching invoice details:', error);
          toast.error('Failed to load payment history');
        } finally {
          setLoadingInvoiceDetails(prev => {
            const newSet = new Set(prev);
            newSet.delete(invoiceId);
            return newSet;
          });
        }
      }
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }

    setIsRecordingPayment(true);

    try {
      await recordPayment({
        invoice_id: selectedInvoice.invoice_id || selectedInvoice.name,
        paid_amount: amount,
        mode_of_payment: paymentMode,
        payment_date: paymentDate,
        reference_no: paymentReference || undefined,
        reference_date: paymentDate,
      });

      toast.success('Payment recorded successfully!');
      
      // Close modal and reset form
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      setPaymentMode('Cash');
      setPaymentReference('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      console.error('Payment recording error:', error);
      toast.error(error?.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInvoiceMutation.mutateAsync(invoiceId);
      toast.success('Invoice deleted successfully');
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      // Error toast is already shown by the mutation hook
    }
  };

  const handlePrintInvoice = async (invoice: any) => {
    try {
      toast.loading('Loading invoice details...');
      
      // Fetch full invoice details from API
      const { paymentService } = await import('../api/services');
      const fullInvoice = await paymentService.getInvoice(invoice.invoice_id || invoice.name);
      
      toast.dismiss();

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow pop-ups to print invoice');
        return;
      }

      // Use full invoice data with items
      // Cast to any since API returns additional fields not in type definition
      const fullInvoiceData = fullInvoice as any;
      const invoicePatient = fullInvoiceData.patient || patient;

      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Invoice ${fullInvoice.invoice_id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
              .company-info h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
              .company-info p { color: #666; font-size: 14px; line-height: 1.6; }
              .invoice-info { text-align: right; }
              .invoice-info h2 { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
              .invoice-info p { font-size: 14px; color: #666; margin: 5px 0; }
              .invoice-info .invoice-number { font-weight: bold; color: #333; font-size: 16px; }
              .billing-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .billing-box { width: 48%; }
              .billing-box h3 { color: #2563eb; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
              .billing-box p { font-size: 14px; line-height: 1.8; color: #555; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .items-table thead { background: #f3f4f6; }
              .items-table th { padding: 12px; text-align: left; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb; }
              .items-table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e5e7eb; color: #555; }
              .items-table tbody tr:hover { background: #f9fafb; }
              .items-table .text-right { text-align: right; }
              .totals { margin-left: auto; width: 300px; }
              .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
              .totals-row.subtotal { border-top: 1px solid #e5e7eb; }
              .totals-row.total { border-top: 2px solid #2563eb; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: #2563eb; }
              .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
              .status-paid { background: #d1fae5; color: #065f46; }
              .status-unpaid { background: #fee2e2; color: #991b1b; }
              .status-partial { background: #fef3c7; color: #92400e; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
              .notes { margin-top: 30px; padding: 15px; background: #f9fafb; border-left: 4px solid #2563eb; }
              .notes h4 { color: #2563eb; margin-bottom: 8px; font-size: 14px; }
              .notes p { font-size: 13px; color: #555; line-height: 1.6; }
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
              .print-button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
              .print-button:hover { background: #1d4ed8; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <button class="print-button no-print" onclick="window.print()">🖨️ Print Invoice</button>
              
              <div class="header">
                <div class="company-info">
                  <h1>Dental Clinic</h1>
                  <p>Professional Dental Care Services</p>
                  <p>Email: info@dentalclinic.com</p>
                  <p>Phone: +91 1234567890</p>
                </div>
                <div class="invoice-info">
                  <h2>INVOICE</h2>
                  <p class="invoice-number">${fullInvoice.invoice_id}</p>
                  <p><strong>Date:</strong> ${new Date(fullInvoice.posting_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Due Date:</strong> ${new Date(fullInvoice.due_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <span class="status-badge ${fullInvoice.status === 'Paid' ? 'status-paid' : fullInvoice.status === 'Partially Paid' ? 'status-partial' : 'status-unpaid'}">
                    ${fullInvoice.status}
                  </span>
                </div>
              </div>

              <div class="billing-section">
                <div class="billing-box">
                  <h3>Bill To:</h3>
                  <p><strong>${invoicePatient?.patient_name || fullInvoiceData.patient?.patient_name || fullInvoice.patient_name || 'N/A'}</strong></p>
                  <p>Patient ID: ${invoicePatient?.patient_id || fullInvoiceData.patient?.patient_id || fullInvoice.patient_id || 'N/A'}</p>
                  <p>Phone: ${invoicePatient?.mobile || fullInvoiceData.patient?.mobile || patient?.mobile || 'N/A'}</p>
                  ${invoicePatient?.email ? `<p>Email: ${invoicePatient.email}</p>` : ''}
                </div>
                <div class="billing-box">
                  <h3>Payment Information:</h3>
                  <p><strong>Total Amount:</strong> ₹${fullInvoice.grand_total.toLocaleString('en-IN')}</p>
                  <p><strong>Amount Paid:</strong> ₹${((fullInvoiceData.paid_amount || (fullInvoice.grand_total - fullInvoice.outstanding_amount)) || 0).toLocaleString('en-IN')}</p>
                  <p><strong>Balance Due:</strong> ₹${fullInvoice.outstanding_amount.toLocaleString('en-IN')}</p>
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
                  ${fullInvoice.items && fullInvoice.items.length > 0 ? fullInvoice.items.map((item: any) => `
                    <tr>
                      <td>
                        <strong>${item.item_name || item.description}</strong>
                        ${item.description && item.description !== item.item_name ? `<br><small style="color: #888;">${item.description}</small>` : ''}
                      </td>
                      <td class="text-right">${item.qty}</td>
                      <td class="text-right">₹${item.rate.toLocaleString('en-IN')}</td>
                      <td class="text-right">₹${item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="4" style="text-align: center; color: #999;">No items available</td></tr>'}
                </tbody>
              </table>

              <div class="totals">
                <div class="totals-row subtotal">
                  <span>Subtotal:</span>
                  <span>₹${fullInvoice.grand_total.toLocaleString('en-IN')}</span>
                </div>
                <div class="totals-row total">
                  <span>Total Amount:</span>
                  <span>₹${fullInvoice.grand_total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              ${fullInvoiceData.remarks && fullInvoiceData.remarks !== 'No Remarks' ? `
                <div class="notes">
                  <h4>Notes:</h4>
                  <p>${fullInvoiceData.remarks}</p>
                </div>
              ` : ''}

              <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated invoice. No signature required.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    } catch (error: any) {
      toast.dismiss();
      console.error('Print invoice error:', error);
      toast.error(error?.message || 'Failed to load invoice details');
    }
  };

  const handlePrintReceipt = (payment: any, invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print receipt');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt ${payment.payment_id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .receipt-container { max-width: 600px; margin: 0 auto; border: 2px solid #2563eb; border-radius: 8px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 30px; }
            .receipt-title { text-align: center; margin-bottom: 30px; }
            .receipt-title h2 { color: #2563eb; font-size: 22px; margin-bottom: 5px; }
            .receipt-title p { color: #666; font-size: 14px; }
            .info-section { margin-bottom: 25px; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #666; font-size: 14px; font-weight: 500; }
            .info-value { color: #333; font-size: 14px; font-weight: 600; text-align: right; }
            .amount-section { background: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
            .amount-section .label { color: #2563eb; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
            .amount-section .amount { color: #2563eb; font-size: 36px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
            .footer p { color: #666; font-size: 12px; line-height: 1.8; }
            .signature-section { margin-top: 40px; padding-top: 20px; }
            .signature-box { display: inline-block; border-top: 2px solid #333; padding-top: 10px; min-width: 200px; text-align: center; }
            .signature-box p { font-size: 12px; color: #666; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
            .print-button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; font-size: 14px; display: block; margin-left: auto; margin-right: auto; }
            .print-button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">🖨️ Print Receipt</button>
          
          <div class="receipt-container">
            <div class="header">
              <h1>Dental Clinic</h1>
              <p>Professional Dental Care Services</p>
              <p>Email: info@dentalclinic.com | Phone: +91 1234567890</p>
            </div>

            <div class="content">
              <div class="receipt-title">
                <h2>PAYMENT RECEIPT</h2>
                <p>${payment.payment_id}</p>
              </div>

              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">Receipt Date:</span>
                  <span class="info-value">${new Date(payment.posting_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Mode:</span>
                  <span class="info-value">${payment.mode_of_payment}</span>
                </div>
                ${payment.reference_no ? `
                <div class="info-row">
                  <span class="info-label">Reference No:</span>
                  <span class="info-value">${payment.reference_no}</span>
                </div>
                ` : ''}
                ${payment.reference_date ? `
                <div class="info-row">
                  <span class="info-label">Reference Date:</span>
                  <span class="info-value">${new Date(payment.reference_date).toLocaleDateString('en-IN')}</span>
                </div>
                ` : ''}
              </div>

              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">Patient Name:</span>
                  <span class="info-value">${invoice.patient?.patient_name || invoice.patient_name || patient?.patient_name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Patient ID:</span>
                  <span class="info-value">${invoice.patient?.patient_id || invoice.patient_id || patient?.patient_id || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Invoice Number:</span>
                  <span class="info-value">${invoice.invoice_id || invoice.name}</span>
                </div>
              </div>

              <div class="amount-section">
                <div class="label">AMOUNT PAID</div>
                <div class="amount">₹${payment.paid_amount.toLocaleString('en-IN')}</div>
              </div>

              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">Invoice Total:</span>
                  <span class="info-value">₹${(invoice.grand_total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Paid:</span>
                  <span class="info-value">₹${(invoice.paid_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Balance Due:</span>
                  <span class="info-value">₹${(invoice.outstanding_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div class="footer">
                <p>Thank you for your payment!</p>
                <p>This is a computer-generated receipt. No signature required.</p>
                <p style="margin-top: 10px;">For any queries, please contact us at info@dentalclinic.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <div className="flex min-h-screen bg-primary-50">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-20">
    <MobileContainer>
      <div className="min-h-screen bg-primary-50 relative">
        <TopBar 
          title={`Patient - ${patient?.patient_name || patientId || 'Details'}`}
          onBack={() => navigate('/patients')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4" style={{ height: 'calc(100vh - 60px)' }}>
          
          {/* Desktop Layout - Two Column */}
          <div className="hidden lg:block px-6 py-6">
            <div className="grid grid-cols-3 gap-6">
              
              {/* Left Sidebar - Patient Info */}
              <div className="col-span-1 space-y-4">
                
                {/* Patient Card */}
                <Card className="p-6">
                  {patientLoading ? (
                    <div className="animate-pulse">
                      <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  ) : patient ? (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4">
                        {patient.sex === 'Female' ? (
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        ) : (
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-1">{patient.name}</h2>
                      <p className="text-sm text-gray-500 mb-4">ID: {patient.patient_id}</p>
                      
                      <div className="space-y-3 text-left border-t pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-semibold text-gray-800">{patient.mobile}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-semibold text-gray-800">{patient.age || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-semibold text-gray-800">{patient.sex || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">DOB:</span>
                          <span className="font-semibold text-gray-800">
                            {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Patient not found</p>
                    </div>
                  )}
                </Card>

                {/* Payment Summary Card */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Payment Summary</h3>
                  {paymentSummaryLoading ? (
                    <div className="space-y-3">
                      <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                      <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{paymentSummary?.total_paid?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-green-700 mt-1">Total Paid</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="text-2xl font-bold text-orange-600">
                          ₹{paymentSummary?.total_pending?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-orange-700 mt-1">Pending</div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setShowUpload(true)}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      }
                    >
                      Upload Documents
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleNewAppointment}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                    >
                      New Appointment
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/invoice', { state: { patient, appointmentId } })}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      }
                    >
                      Create Invoice
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Right Content - Medical Records & Payments */}
              <div className="col-span-2 space-y-6">
                
                {/* Section Tabs */}
                <div className="flex bg-white rounded-lg border border-gray-200">
                  <button
                    onClick={() => setCurrentSection('medical')}
                    className={`flex-1 py-3 px-6 text-sm font-bold font-lato transition-colors ${
                      currentSection === 'medical'
                        ? 'bg-primary-600 text-white rounded-lg shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Medical History
                  </button>
                  <button
                    onClick={() => setCurrentSection('dental-chart')}
                    className={`flex-1 py-3 px-6 text-sm font-bold font-lato transition-colors ${
                      currentSection === 'dental-chart'
                        ? 'bg-primary-600 text-white rounded-lg shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Dental Chart
                  </button>
                  <button
                    onClick={() => setCurrentSection('payments')}
                    className={`flex-1 py-3 px-6 text-sm font-bold font-lato transition-colors ${
                      currentSection === 'payments'
                        ? 'bg-primary-600 text-white rounded-lg shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Payment Details
                  </button>
                </div>

                {/* Medical History Content */}
                {currentSection === 'medical' && (
                  <div className="space-y-6">
                    
                    {/* Uploaded Documents */}
                    {isLoadingFiles ? (
                      <Card className="p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                          <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-48 bg-gray-200 rounded"></div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ) : patientFiles.length > 0 ? (
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Uploaded Documents ({filteredFiles.length})</h3>
                        </div>

                        {/* Category Filter Pills */}
                        {fileCategories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            <button
                              onClick={() => setSelectedFileCategory('all')}
                              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                                selectedFileCategory === 'all'
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              All ({patientFiles.length})
                            </button>
                            {fileCategories.map((category: string) => {
                              const count = patientFiles.filter((f: any) => f.file_category === category).length;
                              return (
                                <button
                                  key={category}
                                  onClick={() => setSelectedFileCategory(category)}
                                  className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${
                                    selectedFileCategory === category
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {category} ({count})
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Desktop Grid */}
                        {filteredFiles.length > 0 ? (
                          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredFiles.map((file: any) => (
                              <div key={file.file_id} className="group">
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                  {fileUploadService.isImageFile(file.file_name) ? (
                                    <div 
                                      className="relative w-full h-40 bg-gray-100 overflow-hidden cursor-pointer"
                                      onClick={() => setFullscreenImage(`${API_BASE_URL}${file.file_url}`)}
                                    >
                                      <img
                                        src={`${API_BASE_URL}${file.file_url}`}
                                        alt={file.file_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                      <div className="absolute top-2 right-2">
                                        <span className="px-2 py-1 bg-black/60 text-white text-xs rounded-full capitalize">
                                          {file.file_category || 'image'}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
                                      <div className="text-5xl mb-2">
                                        {fileUploadService.getFileIcon(file.file_name)}
                                      </div>
                                      <span className="px-3 py-1 bg-white text-gray-700 text-xs rounded-full capitalize shadow-sm">
                                        {file.file_category || 'document'}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="p-3">
                                    <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                                      {file.file_name}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                      <span>{fileUploadService.formatFileSize(file.file_size)}</span>
                                      <span>{new Date(file.creation).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                      <a
                                        href={`${API_BASE_URL}${file.file_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded hover:bg-primary-700 transition-colors"
                                      >
                                        View
                                      </a>
                                      <a
                                        href={`${API_BASE_URL}${file.download_url}`}
                                        download
                                        className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No {selectedFileCategory === 'all' ? '' : selectedFileCategory} documents found</p>
                          </div>
                        )}
                      </Card>
                    ) : null}

                    {/* Prescriptions */}
                    {/* Show existing medical_history from patient record if available */}
                    {medicalHistory && (
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Existing Medical History</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold text-gray-600">Diabetic:</span>
                            <p className="text-gray-900">{medicalHistory.diabetic ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">Blood Pressure:</span>
                            <p className="text-gray-900">{medicalHistory.blood_pressure || '-'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">Cardiac History:</span>
                            <p className="text-gray-900">{medicalHistory.cardiac_history ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">Allergies:</span>
                            <p className="text-gray-900">{medicalHistory.allergies ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">Family Heart Disease:</span>
                            <p className="text-gray-900">{medicalHistory.family_heart_disease ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-600">COVID Vaccinated:</span>
                            <p className="text-gray-900">{medicalHistory.covid_vaccinated ? 'Yes' : 'No'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-semibold text-gray-600">Other:</span>
                            <p className="text-gray-900">{medicalHistory.other || '-'}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Prescriptions & Clinical Records</h3>
                        <button
                          onClick={() => setShowNewPrescriptionModal(true)}
                          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Prescription
                        </button>
                      </div>
                      
                      {prescriptionsLoading ? (
                        <div className="space-y-4">
                          {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                              <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : !prescriptions || prescriptions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No prescription records available</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {prescriptions?.map((prescription) => {
                            // Use detailed data if available, otherwise use list data
                            const recordId = prescription.name || prescription.record_id;
                            const detailedData = detailedPrescriptions[recordId];
                            const displayData = detailedData || prescription;
                            const isLoadingDetail = loadingDetails.has(recordId);
                            
                            return (
                            <div key={recordId} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-700">
                                  {new Date(prescription.encounter_date || prescription.posting_date || prescription.creation || new Date()).toLocaleDateString()}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => handleDeletePrescription(recordId)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete prescription"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => toggleEdit(recordId)}
                                    className="text-blue-500 hover:text-blue-700 p-1"
                                    title="Edit prescription"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => togglePrescription(recordId)}
                                    className="text-gray-400 transform transition-transform duration-200"
                                    disabled={isLoadingDetail}
                                  >
                                    {isLoadingDetail ? (
                                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      <svg 
                                        className={`w-4 h-4 ${expandedPrescriptions.has(recordId) ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {expandedPrescriptions.has(recordId) && detailedData && (
                                <div className="space-y-4 pt-3 border-t">
                                  {/* Clinical Details */}
                                  <div>
                                    <h5 className="text-xs font-bold text-gray-700 mb-2">CLINICAL DETAILS</h5>
                                    {editablePrescriptions.has(recordId) ? (
                                      <div className="space-y-3 text-sm">
                                        <div>
                                          <label className="block font-semibold text-gray-600 mb-1">Chief Complaint:</label>
                                          <textarea
                                            value={editedPrescriptionData[recordId]?.chief_complaint || displayData.chief_complaint}
                                            onChange={(e) => handlePrescriptionFieldChange(recordId, 'chief_complaint', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-semibold text-gray-600 mb-1">Symptoms:</label>
                                          <textarea
                                            value={editedPrescriptionData[recordId]?.symptoms || displayData.symptoms}
                                            onChange={(e) => handlePrescriptionFieldChange(recordId, 'symptoms', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-semibold text-gray-600 mb-1">Diagnosis:</label>
                                          <textarea
                                            value={editedPrescriptionData[recordId]?.diagnosis || displayData.diagnosis}
                                            onChange={(e) => handlePrescriptionFieldChange(recordId, 'diagnosis', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-semibold text-gray-600 mb-1">Treatment Plan:</label>
                                          <textarea
                                            value={editedPrescriptionData[recordId]?.treatment_plan || displayData.treatment_plan}
                                            onChange={(e) => handlePrescriptionFieldChange(recordId, 'treatment_plan', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            rows={3}
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-semibold text-gray-600 mb-1">Status:</label>
                                          <select
                                            value={editedPrescriptionData[recordId]?.status || displayData.status}
                                            onChange={(e) => handlePrescriptionFieldChange(recordId, 'status', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                          >
                                            <option value="Active">Active</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                          </select>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-semibold text-gray-600">Chief Complaint:</span>
                                          <p className="text-gray-900">{displayData.chief_complaint}</p>
                                        </div>
                                        <div>
                                          <span className="font-semibold text-gray-600">Symptoms:</span>
                                          <p className="text-gray-900">{displayData.symptoms}</p>
                                        </div>
                                        <div>
                                          <span className="font-semibold text-gray-600">Diagnosis:</span>
                                          <p className="text-gray-900">{displayData.diagnosis}</p>
                                        </div>
                                        <div>
                                          <span className="font-semibold text-gray-600">Treatment Plan:</span>
                                          <p className="text-gray-900">{displayData.treatment_plan}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Medications */}
                                  {displayData.medications && displayData.medications.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-bold text-gray-700 mb-2">MEDICATIONS</h5>
                                      <div className="space-y-2">
                                        {displayData.medications.map((medication: any, index: number) => (
                                          <div key={index} className="text-sm bg-green-50 p-3 rounded">
                                            <div className="font-semibold text-green-800">{medication.drug_name}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              {medication.dosage} - {medication.interval} for {medication.period}
                                            </div>
                                            <div className="text-xs text-gray-500">Form: {medication.dosage_form}</div>
                                            {medication.comment && (
                                              <div className="text-xs text-gray-500 mt-1">{medication.comment}</div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Investigations */}
                                  {displayData.investigations && displayData.investigations.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-bold text-gray-700 mb-2">INVESTIGATIONS</h5>
                                      <div className="space-y-2">
                                        {displayData.investigations.map((investigation: any, index: number) => (
                                          <div key={index} className="text-sm bg-blue-50 p-3 rounded">
                                            <div className="font-semibold text-blue-800">{investigation.lab_test_name}</div>
                                            <div className="text-xs text-gray-600">Code: {investigation.lab_test_code}</div>
                                            {investigation.lab_test_comment && (
                                              <div className="text-xs text-gray-500 mt-1">{investigation.lab_test_comment}</div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons for Edit Mode - DESKTOP */}
                                  {editablePrescriptions.has(recordId) && (
                                    <div className="flex space-x-2 pt-4 border-t border-gray-100">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleEdit(recordId)}
                                        disabled={isUpdating}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSavePrescription(recordId)}
                                        disabled={isUpdating}
                                      >
                                        {isUpdating ? 'Saving...' : 'Save Changes'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* Payments Content */}
                {currentSection === 'payments' && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Payment History</h3>
                    {invoicesLoading ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                            <div className="h-12 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : !displayInvoices || displayInvoices.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No payment history available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayInvoices.map((invoice: any) => (
                          <div key={invoice.invoice_id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-sm font-bold text-gray-700">{invoice.invoice_id || invoice.name}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  invoice.status === 'Paid' 
                                    ? 'bg-green-100 text-green-800'
                                    : invoice.status === 'Partially Paid'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {invoice.status || (invoice.pending > 0 ? 'Unpaid' : 'Paid')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(invoice.posting_date || invoice.date).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice.invoice_id || invoice.name)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                                  title="Delete Invoice"
                                  disabled={deleteInvoiceMutation.isPending}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-gray-50 rounded p-2">
                                <div className="text-sm font-bold text-gray-700">₹{(invoice.grand_total || invoice.amount || 0).toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Total</div>
                              </div>
                              <div className="bg-green-50 rounded p-2">
                                <div className="text-sm font-bold text-green-600">₹{(invoice.paid_amount || invoice.paid || (invoice.grand_total - invoice.outstanding_amount) || 0).toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Paid</div>
                              </div>
                              <div className="bg-red-50 rounded p-2">
                                <div className="text-sm font-bold text-red-600">₹{(invoice.pending || invoice.outstanding_amount || 0).toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                              </div>
                            </div>
                            
                            {/* Payment History Section */}
                            {expandedInvoices.has(invoice.invoice_id || invoice.name) && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                {loadingInvoiceDetails.has(invoice.invoice_id || invoice.name) ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                                  </div>
                                ) : invoiceDetails[invoice.invoice_id || invoice.name]?.payments?.length > 0 ? (
                                  <div>
                                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Payment History</h5>
                                    <div className="space-y-2">
                                      {invoiceDetails[invoice.invoice_id || invoice.name].payments.map((payment: any, idx: number) => (
                                        <div key={payment.payment_id || idx} className="bg-gray-50 rounded p-3 text-xs">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-700">{payment.payment_id}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-500">{new Date(payment.posting_date).toLocaleDateString()}</span>
                                              <button
                                                onClick={() => handlePrintReceipt(payment, invoiceDetails[invoice.invoice_id || invoice.name])}
                                                className="text-primary-600 hover:text-primary-800 transition-colors"
                                                title="Print Receipt"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-600">{payment.mode_of_payment}</span>
                                            <span className="font-bold text-green-600">₹{payment.paid_amount.toLocaleString()}</span>
                                          </div>
                                          {payment.reference_no && (
                                            <div className="text-gray-500 mt-1">Ref: {payment.reference_no}</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2 text-xs text-gray-500">No payments recorded yet</div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex space-x-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => toggleInvoiceExpansion(invoice.invoice_id || invoice.name)}
                              >
                                {expandedInvoices.has(invoice.invoice_id || invoice.name) ? 'Hide' : 'View'} Payment History
                              </Button>
                              {((invoice.outstanding_amount && invoice.outstanding_amount > 0) || (invoice.pending && invoice.pending > 0)) && (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleOpenPaymentModal(invoice)}
                                >
                                  Record Payment
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={() => handlePrintInvoice(invoice)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* Dental Chart Content */}
                {currentSection === 'dental-chart' && (
                  <div>
                    <DentalChart 
                      patientId={patientId!}
                      data={dentalChartData}
                      onChange={setDentalChartData}
                      readOnly={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout - Original */}
          <div className="lg:hidden px-4 space-y-6 py-4">
          {/* Patient Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 text-white shadow-lg">{patientLoading ? (
              <div className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-white/20 rounded w-full"></div>
                  <div className="h-3 bg-white/20 rounded w-2/3"></div>
                </div>
              </div>
            ) : patient ? (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                  {patient.sex === 'Female' ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold font-lato mb-1">
                    History for<br />
                    {patient.name}
                  </h2>
                  <div className="text-xs font-lato space-y-1">
                    <div className="flex justify-between">
                      <span>Patient id: {patient.patient_id}</span>
                      <span>Phone: {patient.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Age: {patient.age || 'N/A'}</span>
                      <span>DOB: {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span>Gender: {patient.sex || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-white/80">Patient not found</p>
              </div>
            )}
            
            <hr className="my-4 border-white/30" />
            
            <div className="flex space-x-4">
              <Button 
                size="sm" 
                className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                onClick={() => setShowUpload(true)}
              >
                Upload Report
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                onClick={handleNewAppointment}
              >
                New Appointment
              </Button>
            </div>

            {/* Payment Summary in Header */}
            <div className="mt-3 pt-3 border-t border-white/30">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center">
                  <div className="font-bold">₹{paymentSummary?.total_paid?.toLocaleString() || '0'}</div>
                  <div className="text-white/80">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-200">₹{paymentSummary?.total_pending?.toLocaleString() || '0'}</div>
                  <div className="text-white/80">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentSection('medical')}
              className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-bold font-lato transition-colors ${
                currentSection === 'medical'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Medical History
            </button>
            <button
              onClick={() => setCurrentSection('payments')}
              className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-bold font-lato transition-colors ${
                currentSection === 'payments'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Payment Details
            </button>
          </div>

          {/* Medical History Section */}
          {currentSection === 'medical' && (
            <div>
              <h3 className="text-base font-bold text-gray-700 font-lato mb-4">
                Medical History
              </h3>

              {/* Uploaded Files Section */}
              {isLoadingFiles ? (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 font-lato mb-3">
                    Uploaded Documents
                  </h4>
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : patientFiles.length > 0 ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-700 font-lato">
                      Uploaded Documents ({filteredFiles.length})
                    </h4>
                  </div>

                  {/* Category Filter Pills */}
                  {fileCategories.length > 0 && (
                    <div className="overflow-x-auto pb-3 -mx-6 px-6 mb-4">
                      <div className="flex space-x-2" style={{ minWidth: 'min-content' }}>
                        <button
                          onClick={() => setSelectedFileCategory('all')}
                          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                            selectedFileCategory === 'all'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All ({patientFiles.length})
                        </button>
                        {fileCategories.map((category: string) => {
                          const count = patientFiles.filter((f: any) => f.file_category === category).length;
                          return (
                            <button
                              key={category}
                              onClick={() => setSelectedFileCategory(category)}
                              className={`px-4 py-2 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                                selectedFileCategory === category
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {category} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Mobile: Horizontal scrollable gallery */}
                  {filteredFiles.length > 0 ? (
                    <>
                      <div className="overflow-x-auto pb-2 -mx-6 px-6">
                        <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
                          {filteredFiles.map((file: any) => (
                            <div key={file.file_id} className="flex-shrink-0 w-64">
                              <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                                {/* Image preview */}
                                {fileUploadService.isImageFile(file.file_name) ? (
                                  <div 
                                    className="relative w-full h-64 bg-gray-100 overflow-hidden cursor-pointer group"
                                    onClick={() => setFullscreenImage(`${API_BASE_URL}${file.file_url}`)}
                                  >
                                    <img
                                      src={`${API_BASE_URL}${file.file_url}`}
                                      alt={file.file_name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    </div>
                                    {/* Category badge */}
                                    <div className="absolute top-3 right-3">
                                      <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full capitalize font-semibold">
                                        {file.file_category || 'image'}
                                      </span>
                                    </div>
                                    {/* Click to fullscreen hint */}
                                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded">
                                        Click to view fullscreen
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
                                    <div className="text-6xl mb-4">
                                      {fileUploadService.getFileIcon(file.file_name)}
                                    </div>
                                    <span className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full font-semibold capitalize shadow-sm">
                                      {file.file_category || 'document'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* File details */}
                                <div className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2">
                                      {file.file_name}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFile(file.file_id);
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                      title="Delete file"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <span className="font-medium">{fileUploadService.formatFileSize(file.file_size)}</span>
                                    <span>{new Date(file.creation).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  {file.description && (
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                      {file.description}
                                    </p>
                                  )}
                                  
                                  {/* Action buttons */}
                                  <div className="flex space-x-2">
                                    <a
                                      href={`${API_BASE_URL}${file.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View
                                    </a>
                                    <a
                                      href={`${API_BASE_URL}${file.download_url}`}
                                      download
                                      className="flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Scroll hint */}
                      {filteredFiles.length > 1 && (
                        <div className="flex items-center justify-center mt-3 text-xs text-gray-400">
                          <svg className="w-4 h-4 mr-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                          Swipe to see more
                        </div>
                      )}
                    </>
                  ) : (
                    <Card className="text-center py-8">
                      <p className="text-gray-500">No {selectedFileCategory === 'all' ? '' : selectedFileCategory} documents found</p>
                    </Card>
                  )}
                </div>
              ) : null}

              {/* Existing Medical History from patient record - Mobile */}
              {medicalHistory && (
                <Card className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 font-lato mb-3">
                    Existing Medical History
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-gray-600">Diabetic:</span>
                      <p className="text-gray-900">{medicalHistory.diabetic ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Blood Pressure:</span>
                      <p className="text-gray-900">{medicalHistory.blood_pressure || '-'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Cardiac History:</span>
                      <p className="text-gray-900">{medicalHistory.cardiac_history ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Allergies:</span>
                      <p className="text-gray-900">{medicalHistory.allergies ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Family Heart Disease:</span>
                      <p className="text-gray-900">{medicalHistory.family_heart_disease ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">COVID Vaccinated:</span>
                      <p className="text-gray-900">{medicalHistory.covid_vaccinated ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-gray-600">Other:</span>
                      <p className="text-gray-900">{medicalHistory.other || '-'}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Prescriptions Section */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700 font-lato">
                  Prescriptions & Records
                </h4>
                <button
                  onClick={() => setShowNewPrescriptionModal(true)}
                  className="px-2.5 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden xs:inline">Create</span>
                  <span className="xs:hidden">New</span>
                </button>
              </div>

              {prescriptionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : !prescriptions || prescriptions.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-gray-500">No prescription records available</p>
                  {patientFiles.length === 0 && (
                    <p className="text-gray-400 text-sm mt-2">Upload documents using the button above</p>
                  )}
                </Card>
              ) : (

              <div className="space-y-3">
                {prescriptions?.map((prescription) => {
                  // Use detailed data if available, otherwise use list data
                  const recordId = prescription.name || prescription.record_id;
                  const detailedData = detailedPrescriptions[recordId];
                  const displayData = detailedData || prescription;
                  const isLoadingDetail = loadingDetails.has(recordId);
                  
                  return (
                <Card key={recordId} className="relative p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-600 font-lato">
                      {new Date(prescription.encounter_date || prescription.posting_date || prescription.creation || new Date()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleDeletePrescription(recordId)}
                        className="text-red-500 hover:text-red-700 active:text-red-800 p-1"
                        title="Delete prescription"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => toggleEdit(recordId)}
                        className="text-blue-500 hover:text-blue-700 active:text-blue-800 p-1"
                        title="Edit prescription"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => togglePrescription(recordId)}
                        className="text-gray-400 transform transition-transform duration-200"
                        disabled={isLoadingDetail}
                      >
                        {isLoadingDetail ? (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg 
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${expandedPrescriptions.has(recordId) ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedPrescriptions.has(recordId) && detailedData && (
                    <div className="space-y-3">
                      {/* Investigations Section */}
                      <div className="pt-3 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          INVESTIGATIONS
                        </h5>
                        {editablePrescriptions.has(recordId) ? (
                          <div className="space-y-2">
                            {displayData.investigations?.map((investigation: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-300 rounded text-sm">
                                <div className="font-semibold">{investigation.lab_test_name}</div>
                                <div className="text-xs text-gray-600">Code: {investigation.lab_test_code}</div>
                                {investigation.lab_test_comment && (
                                  <div className="text-xs text-gray-500">{investigation.lab_test_comment}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {displayData.investigations?.map((investigation: any, index: number) => (
                              <div key={index} className="text-sm text-black font-montserrat">
                                <div className="font-semibold">{investigation.lab_test_name}</div>
                                <div className="text-xs text-gray-600">Code: {investigation.lab_test_code}</div>
                                {investigation.lab_test_comment && (
                                  <div className="text-xs text-gray-500">{investigation.lab_test_comment}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Medications Section */}
                      <div className="pt-3 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          MEDICATIONS
                        </h5>
                        {editablePrescriptions.has(recordId) ? (
                          <div className="space-y-2">
                            {displayData.medications?.map((medication: any, index: number) => (
                              <div key={index} className="p-2 border border-gray-300 rounded text-sm">
                                <div className="font-semibold">{medication.drug_name}</div>
                                <div className="text-xs text-gray-600">
                                  {medication.dosage} - {medication.interval} for {medication.period}
                                </div>
                                <div className="text-xs text-gray-500">Form: {medication.dosage_form}</div>
                                {medication.comment && (
                                  <div className="text-xs text-gray-500">{medication.comment}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {displayData.medications?.map((medication: any, index: number) => (
                              <div key={index} className="text-sm text-green-700 font-montserrat">
                                <div className="font-semibold">{medication.drug_name}</div>
                                <div className="text-xs text-gray-600">
                                  {medication.dosage} - {medication.interval} for {medication.period}
                                </div>
                                <div className="text-xs text-gray-500">Form: {medication.dosage_form}</div>
                                {medication.comment && (
                                  <div className="text-xs text-gray-500">{medication.comment}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Notes Section */}
                      <div className="pt-3 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          CLINICAL DETAILS
                        </h5>
                        <div className="space-y-2.5 text-xs sm:text-sm font-montserrat">
                          <div>
                            <span className="font-semibold text-gray-700">Chief Complaint:</span>
                            {editablePrescriptions.has(recordId) ? (
                              <textarea
                                value={editedPrescriptionData[recordId]?.chief_complaint || displayData.chief_complaint}
                                onChange={(e) => handlePrescriptionFieldChange(recordId, 'chief_complaint', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                rows={2}
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{displayData.chief_complaint}</p>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Symptoms:</span>
                            {editablePrescriptions.has(recordId) ? (
                              <textarea
                                value={editedPrescriptionData[recordId]?.symptoms || displayData.symptoms}
                                onChange={(e) => handlePrescriptionFieldChange(recordId, 'symptoms', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                rows={2}
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{displayData.symptoms}</p>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Diagnosis:</span>
                            {editablePrescriptions.has(recordId) ? (
                              <textarea
                                value={editedPrescriptionData[recordId]?.diagnosis || displayData.diagnosis}
                                onChange={(e) => handlePrescriptionFieldChange(recordId, 'diagnosis', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                rows={2}
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{displayData.diagnosis}</p>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Treatment Plan:</span>
                            {editablePrescriptions.has(recordId) ? (
                              <textarea
                                value={editedPrescriptionData[recordId]?.treatment_plan || displayData.treatment_plan}
                                onChange={(e) => handlePrescriptionFieldChange(recordId, 'treatment_plan', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                rows={3}
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{displayData.treatment_plan}</p>
                            )}
                          </div>
                          
                          {editablePrescriptions.has(recordId) && (
                            <>
                              <div>
                                <span className="font-semibold text-gray-700">Status:</span>
                                <select
                                  value={editedPrescriptionData[recordId]?.status || displayData.status}
                                  onChange={(e) => handlePrescriptionFieldChange(recordId, 'status', e.target.value)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                >
                                  <option value="Active">Active</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Edit Mode */}
                      {editablePrescriptions.has(recordId) && (
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEdit(recordId)}
                            className="flex-1 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSavePrescription(recordId)}
                            disabled={isUpdating}
                            className="flex-1 text-xs"
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
                );
              })}
              </div>
            )}
            </div>
          )}

          {/* Payment Details Section */}
          {currentSection === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-700 font-lato">
                  Payment Summary
                </h3>
              </div>

              {/* Payment Summary Cards */}
              {paymentSummaryLoading ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="text-center animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </Card>
                  <Card className="text-center animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </Card>
                </div>
              ) : paymentSummary ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="text-center">
                    <div className="text-2xl font-bold text-green-600 font-lato">
                      ₹{(paymentSummary.total_paid || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 font-lato mt-1">Total Paid</div>
                  </Card>
                  <Card className="text-center">
                    <div className="text-2xl font-bold text-red-600 font-lato">
                      ₹{(paymentSummary.total_pending || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 font-lato mt-1">Total Pending</div>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="text-center">
                    <div className="text-2xl font-bold text-gray-400 font-lato">₹0</div>
                    <div className="text-xs text-gray-600 font-lato mt-1">Total Paid</div>
                  </Card>
                  <Card className="text-center">
                    <div className="text-2xl font-bold text-gray-400 font-lato">₹0</div>
                    <div className="text-xs text-gray-600 font-lato mt-1">Total Pending</div>
                  </Card>
                </div>
              )}

              {/* Payment History */}
              <h4 className="text-sm font-bold text-gray-700 font-lato mb-3">
                Payment History
              </h4>

              {invoicesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : !displayInvoices || displayInvoices.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-gray-500">No payment history available</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {displayInvoices.map((invoice: any) => (
                  <Card key={invoice.invoice_id || invoice.name} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-gray-700 font-lato truncate">
                          {invoice.invoice_id || invoice.name}
                        </h5>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                          invoice.status === 'Paid' 
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'Partially Paid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status || (invoice.pending > 0 ? 'Unpaid' : 'Paid')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-gray-500 font-lato hidden sm:inline">
                          {new Date(invoice.posting_date || invoice.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.invoice_id || invoice.name)}
                          className="text-red-500 hover:text-red-700 active:text-red-800 transition-colors p-1"
                          title="Delete Invoice"
                          disabled={deleteInvoiceMutation.isPending}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm text-gray-600 font-montserrat truncate">
                        <strong>Patient:</strong> {invoice.patient_name || patient?.patient_name}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        <div className="text-center p-1.5 bg-gray-50 rounded">
                          <div className="font-bold text-gray-700 text-xs">₹{(invoice.grand_total || invoice.amount || 0).toLocaleString()}</div>
                          <div className="text-gray-500 text-[10px]">Total</div>
                        </div>
                        <div className="text-center p-1.5 bg-green-50 rounded">
                          <div className="font-bold text-green-600 text-xs">₹{(invoice.paid_amount || invoice.paid || (invoice.grand_total - invoice.outstanding_amount) || 0).toLocaleString()}</div>
                          <div className="text-gray-500 text-[10px]">Paid</div>
                        </div>
                        <div className="text-center p-1.5 bg-red-50 rounded">
                          <div className="font-bold text-red-600 text-xs">₹{(invoice.pending || invoice.outstanding_amount || 0).toLocaleString()}</div>
                          <div className="text-gray-500 text-[10px]">Due</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 font-montserrat">
                        <strong>Due:</strong> {new Date(invoice.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      {/* Payment History Section - Mobile */}
                      {expandedInvoices.has(invoice.invoice_id || invoice.name) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {loadingInvoiceDetails.has(invoice.invoice_id || invoice.name) ? (
                            <div className="text-center py-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto"></div>
                            </div>
                          ) : invoiceDetails[invoice.invoice_id || invoice.name]?.payments?.length > 0 ? (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-700 mb-2">Payment History</h6>
                              <div className="space-y-2">
                                {invoiceDetails[invoice.invoice_id || invoice.name].payments.map((payment: any, idx: number) => (
                                  <div key={payment.payment_id || idx} className="bg-gray-50 rounded p-2 text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-semibold text-gray-700">{payment.payment_id}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">{new Date(payment.posting_date).toLocaleDateString()}</span>
                                        <button
                                          onClick={() => handlePrintReceipt(payment, invoiceDetails[invoice.invoice_id || invoice.name])}
                                          className="text-primary-600 hover:text-primary-800 transition-colors"
                                          title="Print Receipt"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">{payment.mode_of_payment}</span>
                                      <span className="font-bold text-green-600">₹{payment.paid_amount.toLocaleString()}</span>
                                    </div>
                                    {payment.reference_no && (
                                      <div className="text-gray-500 mt-1">Ref: {payment.reference_no}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-2 text-xs text-gray-500">No payments recorded yet</div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[80px] text-xs"
                          onClick={() => toggleInvoiceExpansion(invoice.invoice_id || invoice.name)}
                        >
                          {expandedInvoices.has(invoice.invoice_id || invoice.name) ? 'Hide' : 'View'}
                        </Button>
                        {((invoice.outstanding_amount && invoice.outstanding_amount > 0) || (invoice.pending && invoice.pending > 0)) && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="flex-1 min-w-[80px] text-xs"
                            onClick={() => handleOpenPaymentModal(invoice)}
                          >
                            <span className="hidden xs:inline">Record Payment</span>
                            <span className="xs:hidden">Pay</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center justify-center gap-1 px-2 text-xs"
                          onClick={() => handlePrintInvoice(invoice)}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span className="hidden sm:inline">Print</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                </div>
              )}

              {/* Quick Payment Actions */}
              <Card className="mt-6">
                <h4 className="text-sm font-bold text-gray-700 font-lato mb-3">
                  Quick Actions
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate('/invoice', { state: { patient } })}
                    className="flex flex-col items-center justify-center py-4 h-auto"
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs">New Invoice</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      alert('Generating payment report...');
                    }}
                    className="flex flex-col items-center justify-center py-4 h-auto"
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs">Payment Report</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 font-lato">
                  Upload Medical Records
                </h3>
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setSelectedFiles([]);
                    setUploadNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* File Category Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Document Type
                  </label>
                  <select
                    value={fileCategory}
                    onChange={(e) => setFileCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm font-montserrat"
                  >
                    <option value="report">Medical Report</option>
                    <option value="xray">X-ray</option>
                    <option value="photo">Clinical Photo</option>
                    <option value="prescription">Prescription</option>
                    <option value="consent">Consent Form</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date Selection */}
                <InputField
                  label="Report Date"
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                />

                {/* Upload Actions */}
                <div className="flex space-x-4">
                  <Button 
                    size="sm" 
                    variant="primary" 
                    className="flex-1"
                    onClick={handleTakePhoto}
                    disabled={isUploading}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  >
                    Take Photo
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    className="flex-1"
                    onClick={handleUploadFiles}
                    disabled={isUploading}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    }
                  >
                    Browse Files
                  </Button>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                      Selected Files ({selectedFiles.length})
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-lg">
                              {fileUploadService.getFileIcon(file.name)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {fileUploadService.formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Add any additional notes about the files..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm font-montserrat"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowUpload(false);
                      setSelectedFiles([]);
                      setUploadNotes('');
                    }}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    className="flex-1"
                    onClick={handleSaveReport}
                    disabled={isUploading || selectedFiles.length === 0}
                  >
                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Recording Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 font-lato">
                  Record Payment
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                    setPaymentAmount('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isRecordingPayment}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Invoice Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Invoice:</span>
                  <span className="text-sm text-gray-900 font-mono">{selectedInvoice.invoice_id}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                  <span className="text-sm text-gray-900">₹{((selectedInvoice as any).amount || selectedInvoice.grand_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Already Paid:</span>
                  <span className="text-sm text-green-600">₹{((selectedInvoice as any).paid || (selectedInvoice.grand_total - selectedInvoice.outstanding_amount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-bold text-gray-700">Outstanding:</span>
                  <span className="text-lg font-bold text-red-600">₹{((selectedInvoice as any).pending || selectedInvoice.outstanding_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Payment Amount */}
                <InputField
                  label="Payment Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={isRecordingPayment}
                />

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm font-montserrat"
                    disabled={isRecordingPayment}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Date */}
                <InputField
                  label="Payment Date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isRecordingPayment}
                />

                {/* Reference Number (Optional) */}
                <InputField
                  label="Reference Number (Optional)"
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Transaction ID / Cheque No"
                  disabled={isRecordingPayment}
                />

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedInvoice(null);
                      setPaymentAmount('');
                    }}
                    disabled={isRecordingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={handleRecordPayment}
                    disabled={isRecordingPayment || !paymentAmount}
                  >
                    {isRecordingPayment ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <div 
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            onClick={() => setFullscreenImage(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={fullscreenImage}
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Pinch to zoom hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <p className="text-white text-sm">Pinch to zoom • Tap to close</p>
            </div>
          </div>
        )}

        {/* Create Prescription Modal */}
        {showNewPrescriptionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Typography variant="h5" weight="bold" className="text-gray-900">
                    Create New Prescription
                  </Typography>
                  <button
                    onClick={() => setShowNewPrescriptionModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <Stack spacing={4}>
                  {/* Clinical Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint *</label>
                    <textarea
                      value={newPrescription.chief_complaint}
                      onChange={(e) => setNewPrescription({ ...newPrescription, chief_complaint: e.target.value })}
                      placeholder="Main reason for visit..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
                    <textarea
                      value={newPrescription.symptoms}
                      onChange={(e) => setNewPrescription({ ...newPrescription, symptoms: e.target.value })}
                      placeholder="Describe symptoms..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis *</label>
                    <textarea
                      value={newPrescription.diagnosis}
                      onChange={(e) => setNewPrescription({ ...newPrescription, diagnosis: e.target.value })}
                      placeholder="Clinical diagnosis..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan *</label>
                    <textarea
                      value={newPrescription.treatment_plan}
                      onChange={(e) => setNewPrescription({ ...newPrescription, treatment_plan: e.target.value })}
                      placeholder="Recommended treatment plan..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  {/* Medications */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Medications</label>
                      <button
                        onClick={addMedication}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Medication
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newPrescription.medications.map((med, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Medication {index + 1}</span>
                            {newPrescription.medications.length > 1 && (
                              <button
                                onClick={() => removeMedication(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={med.drug_name}
                              onChange={(e) => {
                                const newMeds = [...newPrescription.medications];
                                newMeds[index].drug_name = e.target.value;
                                setNewPrescription({ ...newPrescription, medications: newMeds });
                              }}
                              placeholder="Drug name"
                              className="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => {
                                const newMeds = [...newPrescription.medications];
                                newMeds[index].dosage = e.target.value;
                                setNewPrescription({ ...newPrescription, medications: newMeds });
                              }}
                              placeholder="Dosage"
                              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              value={med.period}
                              onChange={(e) => {
                                const newMeds = [...newPrescription.medications];
                                newMeds[index].period = e.target.value;
                                setNewPrescription({ ...newPrescription, medications: newMeds });
                              }}
                              placeholder="Period (e.g., 7 days)"
                              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <select
                              value={med.dosage_form}
                              onChange={(e) => {
                                const newMeds = [...newPrescription.medications];
                                newMeds[index].dosage_form = e.target.value;
                                setNewPrescription({ ...newPrescription, medications: newMeds });
                              }}
                              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                            >
                              <option value="Tablet">Tablet</option>
                              <option value="Capsule">Capsule</option>
                              <option value="Syrup">Syrup</option>
                              <option value="Injection">Injection</option>
                              <option value="Cream">Cream</option>
                              <option value="Drops">Drops</option>
                            </select>
                            <input
                              type="text"
                              value={med.interval}
                              onChange={(e) => {
                                const newMeds = [...newPrescription.medications];
                                newMeds[index].interval = e.target.value;
                                setNewPrescription({ ...newPrescription, medications: newMeds });
                              }}
                              placeholder="Interval (e.g., Every 8 hours)"
                              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              value={med.comment}
                              onChange={(e) => {
                                const newMeds = [...newPrescription.medications];
                                newMeds[index].comment = e.target.value;
                                setNewPrescription({ ...newPrescription, medications: newMeds });
                              }}
                              placeholder="Instructions (e.g., After meals)"
                              className="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investigations */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Investigations</label>
                      <button
                        onClick={addInvestigation}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Investigation
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newPrescription.investigations.map((inv, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Investigation {index + 1}</span>
                            {newPrescription.investigations.length > 1 && (
                              <button
                                onClick={() => removeInvestigation(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={inv.lab_test_name}
                              onChange={(e) => {
                                const newInvs = [...newPrescription.investigations];
                                newInvs[index].lab_test_name = e.target.value;
                                setNewPrescription({ ...newPrescription, investigations: newInvs });
                              }}
                              placeholder="Test name (e.g., Blood Test, X-Ray)"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              value={inv.lab_test_comment}
                              onChange={(e) => {
                                const newInvs = [...newPrescription.investigations];
                                newInvs[index].lab_test_comment = e.target.value;
                                setNewPrescription({ ...newPrescription, investigations: newInvs });
                              }}
                              placeholder="Additional notes"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Flex gap={3} className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPrescriptionModal(false)}
                      className="flex-1"
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreatePrescription}
                      className="flex-1"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Create Prescription'}
                    </Button>
                  </Flex>
                </Stack>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
      </div>
    </div>
  );
};

export default PrescriptionPage;
