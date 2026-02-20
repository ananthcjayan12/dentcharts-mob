import React, { useState } from 'react';
// Icons removed as they are unused (replaced by SVGs)
import { generateInvoiceHTML } from '../utils/invoiceTemplates';
import { printPrescription, PrescriptionPrintData, downloadPrescriptionPDF } from '../utils/prescriptionTemplates';
import { printHTML } from '../utils/printUtils';
import { compressImage, processFilesWithCompression } from '../utils/imageCompression';
import PrescriptionModal from '../components/prescription/PrescriptionModal';
import { PrescriptionMedicine } from '../api/services/medicine';
import { prescriptionService } from '../api/services/prescription';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
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
import { usePatientInvoices, usePaymentSummary, useRecordPayment, useDeleteInvoice, useCreateInvoice } from '../hooks/usePayments';
import CreateInvoiceModal from '../components/invoices/CreateInvoiceModal';
import { fileUploadService } from '../api/services/fileUpload';
import toast from 'react-hot-toast';
import FileUploadModal from '../components/appointments/FileUploadModal';
import ImageViewerModal from '../components/common/ImageViewerModal';
import EditPatientModal from '../components/patients/EditPatientModal';

// Get API base URL from environment variable (same as API client)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://dev2.localhost:8800';

const PrescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId: rawPatientId } = useParams<{ patientId: string }>();
  const { profile } = useClinic();
  const { user, canAccessPage } = useAuth();

  // Decode the patientId from URL (e.g., "Ananth.C%20Jayan" -> "Ananth.C Jayan")
  const patientId = rawPatientId ? decodeURIComponent(rawPatientId) : undefined;

  // Get appointment ID from location state or query params
  const appointmentId = location.state?.appointmentId || new URLSearchParams(location.search).get('appointmentId');

  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [currentSection, setCurrentSection] = useState<'medical' | 'payments' | 'dental-chart'>('medical');
  const [dentalChartData, setDentalChartData] = useState<Record<number, ToothData>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileCategory, setFileCategory] = useState('report');
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFileCategory, setSelectedFileCategory] = useState<string>('all');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<Array<{ url: string; caption?: string }>>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] = useState(false);
  const [showClinicalDetails, setShowClinicalDetails] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showMedicalHistoryEdit, setShowMedicalHistoryEdit] = useState(false);
  const [editableMedicalHistory, setEditableMedicalHistory] = useState<any>({});
  const [showClinicalRecordModal, setShowClinicalRecordModal] = useState(false);
  const [isCreatingClinicalRecord, setIsCreatingClinicalRecord] = useState(false);
  const [newClinicalRecord, setNewClinicalRecord] = useState({
    notes: '',
  });
  const [recordsTab, setRecordsTab] = useState<'prescriptions' | 'clinical'>('prescriptions');
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([]);
  const [clinicalRecordsLoading, setClinicalRecordsLoading] = useState(false);
  const [expandedClinicalRecords, setExpandedClinicalRecords] = useState<Set<string>>(new Set());
  const [detailedClinicalRecords, setDetailedClinicalRecords] = useState<Record<string, any>>({});
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
  const { mutate: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();

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
        // Fetch files linked directly to the Patient
        const patientFilesList = await fileUploadService.getPatientFiles(patientId);

        // Fetch appointment files
        let appointmentFiles: any[] = [];
        if (appointmentId) {
          // If specific appointmentId provided, fetch files for that appointment only
          try {
            appointmentFiles = await fileUploadService.listFiles({
              reference_doctype: 'Patient Appointment',
              reference_name: appointmentId,
              limit: 100
            });
          } catch (e) {
            console.warn('Failed to fetch appointment files', e);
          }
        } else {
          // When no appointmentId, fetch ALL appointments for this patient
          // and get files for each appointment
          try {
            const { appointmentService } = await import('../api/services');
            const patientAppointments = await appointmentService.getPatientAppointments(patientId, 100);

            // Fetch files for each appointment in parallel
            const appointmentFilePromises = patientAppointments.map(async (apt: any) => {
              try {
                return await fileUploadService.listFiles({
                  reference_doctype: 'Patient Appointment',
                  reference_name: apt.name || apt.id,
                  limit: 100
                });
              } catch {
                return [];
              }
            });

            const allAppointmentFiles = await Promise.all(appointmentFilePromises);
            appointmentFiles = allAppointmentFiles.flat();
          } catch (e) {
            console.warn('Failed to fetch patient appointments for files', e);
          }
        }

        // Merge and de-duplicate files by file_id
        const allFiles = [...patientFilesList, ...appointmentFiles];
        const uniqueFiles = allFiles.reduce((acc: any[], file: any) => {
          const fileId = file.file_id || file.name;
          if (!acc.find((f: any) => (f.file_id || f.name) === fileId)) {
            acc.push(file);
          }
          return acc;
        }, []);

        setPatientFiles(uniqueFiles);
      } catch (error) {
        console.error('Error fetching patient files:', error);
        toast.error('Failed to load patient files');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchPatientFiles();
  }, [patientId, appointmentId]);

  // Fetch clinical records when patient loads
  React.useEffect(() => {
    const fetchClinicalRecords = async () => {
      if (!patientId) return;

      setClinicalRecordsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/method/mob_clinic.mob_clinic.api.clinical_record.get_clinical_records?patient_id=${patientId}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.message?.data) {
          setClinicalRecords(data.message.data);
        }
      } catch (e) {
        console.error('Error fetching clinical records:', e);
      } finally {
        setClinicalRecordsLoading(false);
      }
    };

    fetchClinicalRecords();
  }, [patientId]);

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
        prescription_id: recordId,
        ...editedData,
      });

      // Refetch prescriptions to reflect changes immediately
      await refetchPrescriptions();

      // Close edit mode after successful update
      toggleEdit(recordId);

      // Clear edited data
      setEditedPrescriptionData(prev => {
        const newData = { ...prev };
        delete newData[recordId];
        return newData;
      });

      // Clear detailed prescriptions cache for this record to force refresh
      setDetailedPrescriptions(prev => {
        const newData = { ...prev };
        delete newData[recordId];
        return newData;
      });
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

  // Handler for new prescription modal submission
  const handleNewPrescriptionSubmit = async (medications: PrescriptionMedicine[]) => {
    if (!patientId) return;

    try {
      // Convert from new modal format to API format
      const apiMedications = medications.map(med => ({
        drug_name: med.medicine_name,
        dosage: med.strength || '',
        dosage_form: med.dosage_form,
        interval: `${med.morning}-${med.lunch}-${med.evening}-${med.night}`, // e.g., "1-0-0-1"
        period: `${med.days} days`,
        comment: med.condition + (med.instructions ? ` - ${med.instructions}` : ''),
      }));

      const prescriptionData: any = {
        patient_id: patientId,
        appointment_id: appointmentId,
        medications: apiMedications,
      };

      await createPrescription(prescriptionData);

      // Manually refetch prescriptions to ensure UI updates
      await refetchPrescriptions();

      setShowNewPrescriptionModal(false);
      toast.success('Prescription created successfully');
    } catch (error: any) {
      console.error('Create prescription error:', error);
      toast.error('Failed to create prescription');
    }
  };

  // Legacy handler (kept for compatibility)
  const handleCreatePrescription = async () => {
    if (!patientId) return;

    // Validation - only medications are required now
    const validMedications = newPrescription.medications.filter(m => m.drug_name.trim());
    if (validMedications.length === 0) {
      toast.error('Please add at least one medication');
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

      // Immediately remove the file from state for instant UI update
      setPatientFiles(prevFiles => prevFiles.filter((f: any) => f.file_id !== fileId && f.name !== fileId));

      // Also refresh from server to ensure consistency
      const files = await fileUploadService.getPatientFiles(patientId || '');

      let appointmentFiles: any[] = [];
      if (appointmentId) {
        try {
          appointmentFiles = await fileUploadService.listFiles({
            reference_doctype: 'Patient Appointment',
            reference_name: appointmentId,
            limit: 100
          });
        } catch (e) {
          // ignore
        }
      } else {
        // Fetch ALL appointments for this patient and get files for each
        try {
          const { appointmentService } = await import('../api/services');
          const patientAppointments = await appointmentService.getPatientAppointments(patientId || '', 100);

          const appointmentFilePromises = patientAppointments.map(async (apt: any) => {
            try {
              return await fileUploadService.listFiles({
                reference_doctype: 'Patient Appointment',
                reference_name: apt.name || apt.id,
                limit: 100
              });
            } catch {
              return [];
            }
          });

          const allAppointmentFiles = await Promise.all(appointmentFilePromises);
          appointmentFiles = allAppointmentFiles.flat();
        } catch (e) {
          // ignore
        }
      }

      // Merge and de-duplicate
      const allFiles = [...files, ...appointmentFiles];
      const uniqueFiles = allFiles.reduce((acc: any[], file: any) => {
        const fId = file.file_id || file.name;
        if (!acc.find((f: any) => (f.file_id || f.name) === fId)) {
          acc.push(file);
        }
        return acc;
      }, []);

      setPatientFiles(uniqueFiles);
    } catch (error: any) {
      console.error('Delete file error:', error);
      toast.error(error?.message || 'Failed to delete file');
    }
  };

  const handleOpenImageViewer = (clickedFileId: string) => {
    const imageFiles = filteredFiles.filter((file: any) =>
      fileUploadService.isImageFile(file.file_name)
    );
    const clickedIndex = imageFiles.findIndex((file: any) => file.file_id === clickedFileId);
    const images = imageFiles.map((file: any) => ({
      url: `${API_BASE_URL}${file.file_url}`,
      caption: file.description || file.file_name
    }));
    setViewerImages(images);
    setViewerInitialIndex(clickedIndex >= 0 ? clickedIndex : 0);
    setImageViewerOpen(true);
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

  const handleCreateInvoiceSubmit = (data: any) => {
    if (!patientId) {
      toast.error('No patient selected');
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
      appointment_id: appointmentId || undefined,
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
        toast.success('Invoice created successfully');
      }
    });
  };

  const handlePrintInvoice = async (invoice: any) => {
    try {
      toast.loading('Loading invoice details...');

      // Fetch full invoice details from API
      const { paymentService } = await import('../api/services');
      const fullInvoice = await paymentService.getInvoice(invoice.invoice_id || invoice.name);

      toast.dismiss();


      // Extract clinic branding
      const invoiceSettings = (profile?.invoice_settings || {}) as any;
      const templateId = invoiceSettings.template_id || 'modern';

      // Generate HTML using shared utility
      const invoiceHTML = generateInvoiceHTML(fullInvoice, profile, templateId, user?.name);

      printHTML(invoiceHTML);
    } catch (error: any) {
      toast.dismiss();
      console.error('Print invoice error:', error);
      toast.error(error?.message || 'Failed to generate invoice');
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

              {/* Responsive Layout */}
              <div className="block px-4 lg:px-6 py-4 lg:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

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
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            ) : (
                              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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

                          {/* Edit Profile Button */}
                          <button
                            onClick={() => setShowEditProfileModal(true)}
                            className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Profile
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Patient not found</p>
                        </div>
                      )}
                    </Card>

                    {/* Payment Summary Card */}
                    <div className="grid grid-cols-2 gap-3 lg:hidden">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-green-600">
                          ₹{paymentSummary?.total_paid?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-green-700 uppercase font-semibold mt-1">Total Paid</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-orange-600">
                          ₹{paymentSummary?.total_pending?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-orange-700 uppercase font-semibold mt-1">Pending</div>
                      </div>
                    </div>

                    {/* Desktop Payment Summary Card */}
                    <Card className="p-6 hidden lg:block">
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
                    <div className="flex justify-center gap-6 lg:hidden py-2">
                      {canAccessPage('appointments') && (
                        <button
                          onClick={handleNewAppointment}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700 text-center leading-tight">Appointment</span>
                        </button>
                      )}
                      {canAccessPage('invoice') && (
                        <button
                          onClick={() => setShowCreateInvoiceModal(true)}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 4h6m-6 4h6M9 7h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700 text-center leading-tight">Invoice</span>
                        </button>
                      )}
                      <button
                        onClick={() => setShowUpload(true)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Upload</span>
                      </button>
                    </div>

                    {/* Desktop Quick Actions */}
                    <Card className="p-6 hidden lg:block">
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
                        {canAccessPage('appointments') && (
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
                        )}
                        {canAccessPage('invoice') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setShowCreateInvoiceModal(true)}
                            leftIcon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            }
                          >
                            Create Invoice
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Right Content - Medical Records & Payments */}
                  <div className="lg:col-span-2 space-y-4 lg:space-y-6">

                    {/* Mobile Section Tabs - Pill Style */}
                    <div className="flex bg-gray-100 rounded-full p-1 lg:hidden">
                      <button
                        onClick={() => setCurrentSection('medical')}
                        className={`flex-1 py-2 text-sm font-medium transition-all rounded-full ${currentSection === 'medical' || currentSection === 'dental-chart'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500'
                          }`}
                      >
                        Medical History
                      </button>
                      <button
                        onClick={() => setCurrentSection('payments')}
                        className={`flex-1 py-2 text-sm font-medium transition-all rounded-full ${currentSection === 'payments'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500'
                          }`}
                      >
                        Payments
                      </button>
                    </div>

                    {/* Desktop Section Tabs */}
                    <div className="hidden lg:flex bg-white rounded-lg border border-gray-200">
                      <button
                        onClick={() => setCurrentSection('medical')}
                        className={`flex-1 py-3 px-6 text-sm font-bold font-lato transition-colors ${currentSection === 'medical'
                          ? 'bg-primary-600 text-white rounded-lg shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                          }`}
                      >
                        Medical History
                      </button>
                      <button
                        onClick={() => setCurrentSection('dental-chart')}
                        className={`flex-1 py-3 px-6 text-sm font-bold font-lato transition-colors ${currentSection === 'dental-chart'
                          ? 'bg-primary-600 text-white rounded-lg shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                          }`}
                      >
                        Dental Chart
                      </button>
                      <button
                        onClick={() => setCurrentSection('payments')}
                        className={`flex-1 py-3 px-6 text-sm font-bold font-lato transition-colors ${currentSection === 'payments'
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
                          <Card className="p-4 lg:p-6">
                            <div className="animate-pulse space-y-4">
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="h-40 bg-gray-200 rounded"></div>
                                ))}
                              </div>
                            </div>
                          </Card>
                        ) : patientFiles.length > 0 ? (
                          <Card className="p-4 lg:p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-base lg:text-lg font-bold text-gray-800">Uploaded Documents ({filteredFiles.length})</h3>
                              <button
                                onClick={() => setShowFileUploadModal(true)}
                                className="p-2 lg:px-4 lg:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="hidden lg:inline font-medium text-sm">Upload Files</span>
                              </button>
                            </div>

                            {/* Category Filter Pills - Scrollable on mobile */}
                            {fileCategories.length > 0 && (
                              <div className="flex overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap gap-2 mb-4 scrollbar-hide">
                                <button
                                  onClick={() => setSelectedFileCategory('all')}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${selectedFileCategory === 'all'
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
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
                                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors border ${selectedFileCategory === category
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                      {category} ({count})
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Files Grid */}
                            {filteredFiles.length > 0 ? (
                              <div className="grid grid-cols-2 lg:grid-cols-3 lg:gap-4 gap-3">
                                {filteredFiles.map((file: any) => (
                                  <div key={file.file_id} className="group relative bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    {/* File Preview */}
                                    <div
                                      className="relative w-full h-32 bg-gray-50 cursor-pointer overflow-hidden"
                                      onClick={() => handleOpenImageViewer(file.file_id)}
                                    >
                                      {fileUploadService.isImageFile(file.file_name) ? (
                                        <img
                                          src={`${API_BASE_URL}${file.file_url}`}
                                          alt={file.file_name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                          <div className="text-3xl mb-1">
                                            {fileUploadService.getFileIcon(file.file_name)}
                                          </div>
                                        </div>
                                      )}

                                      {/* Category Badge overlay */}
                                      <div className="absolute top-1 right-1">
                                        <span className="px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded backdrop-blur-sm capitalize">
                                          {file.file_category || 'doc'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="p-2">
                                      <p className="text-xs font-medium text-gray-900 truncate mb-2">
                                        {file.file_name}
                                      </p>

                                      {/* Actions Row */}
                                      <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                                        <span className="text-[10px] text-gray-400">
                                          {new Date(file.creation).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <a
                                            href={`${API_BASE_URL}${file.file_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                            title="View"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                          </a>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFile(file.file_id);
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                            title="Delete"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500">No {selectedFileCategory === 'all' ? '' : selectedFileCategory} documents</p>
                              </div>
                            )}
                          </Card>
                        ) : null}

                        {/* Prescriptions */}
                        {/* Show existing medical_history from patient record if available */}
                        {medicalHistory && (
                          <Card className="p-4 lg:p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-base lg:text-lg font-bold text-gray-800">Existing Medical History</h3>
                              <button
                                onClick={() => {
                                  setEditableMedicalHistory({ ...medicalHistory });
                                  setShowMedicalHistoryEdit(true);
                                }}
                                className="px-3 py-1 text-xs lg:text-sm font-medium text-primary-600 border border-primary-600 rounded-full hover:bg-primary-50 transition-colors"
                              >
                                Edit
                              </button>
                            </div>

                            {/* Important Conditions - Red Badges */}
                            <div className="mb-4">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conditions</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {medicalHistory.nrmh && (
                                  <span className="px-2 lg:px-3 py-1 bg-yellow-50 text-yellow-700 font-semibold text-xs rounded-full border border-yellow-200">
                                    NRMH (No Relevant Medical History)
                                  </span>
                                )}
                                {medicalHistory.diabetic && (
                                  <span className="px-2 lg:px-3 py-1 bg-red-50 text-red-700 font-semibold text-xs rounded-full border border-red-100">
                                    Diabetic
                                  </span>
                                )}
                                {medicalHistory.cardiac_history && (
                                  <span className="px-2 lg:px-3 py-1 bg-red-50 text-red-700 font-semibold text-xs rounded-full border border-red-100">
                                    Cardiac History
                                  </span>
                                )}
                                {medicalHistory.allergies && (
                                  <span className="px-2 lg:px-3 py-1 bg-orange-50 text-orange-700 font-semibold text-xs rounded-full border border-orange-100">
                                    Allergies
                                  </span>
                                )}
                                {medicalHistory.family_heart_disease && (
                                  <span className="px-2 lg:px-3 py-1 bg-red-50 text-red-700 font-semibold text-xs rounded-full border border-red-100">
                                    Family Heart Disease
                                  </span>
                                )}
                                {!medicalHistory.nrmh && !medicalHistory.diabetic && !medicalHistory.cardiac_history && !medicalHistory.allergies && !medicalHistory.family_heart_disease && (
                                  <span className="px-2 lg:px-3 py-1 bg-green-50 text-green-700 font-medium text-xs rounded-full border border-green-100">
                                    No significant conditions
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                              <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Blood Pressure</span>
                                <p className="text-sm font-medium text-gray-900">{medicalHistory.blood_pressure || 'Normal'}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">COVID Vac.</span>
                                <p className="text-sm font-medium text-gray-900">{medicalHistory.covid_vaccinated ? 'Yes' : 'No'}</p>
                              </div>
                              {medicalHistory.other && (
                                <div className="col-span-2">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Other</span>
                                  <p className="text-sm text-gray-900">{medicalHistory.other}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        )}

                        <Card className="p-4 lg:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-bold text-gray-800">Medical Records</h3>
                            <div className="flex gap-2">
                              {/* Mobile: Icon only, Desktop: Text */}
                              <button
                                onClick={() => setShowClinicalRecordModal(true)}
                                className="p-2 lg:px-3 lg:py-2 border border-secondary-600 text-secondary-600 text-sm font-semibold rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-1.5"
                                title="Add Clinical Record"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="hidden lg:inline">Clinical</span>
                              </button>
                              <button
                                onClick={() => setShowNewPrescriptionModal(true)}
                                className="p-2 lg:px-3 lg:py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5"
                                title="New Prescription"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="hidden lg:inline">Prescription</span>
                              </button>
                            </div>
                          </div>

                          {/* Tab Toggle */}
                          <div className="flex mb-4 border-b border-gray-200">
                            <button
                              onClick={() => setRecordsTab('prescriptions')}
                              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${recordsTab === 'prescriptions'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                              Prescriptions ({prescriptions?.length || 0})
                            </button>
                            <button
                              onClick={() => {
                                setRecordsTab('clinical');
                                // Fetch clinical records on first click
                                if (clinicalRecords.length === 0 && patientId) {
                                  setClinicalRecordsLoading(true);
                                  fetch(`${API_BASE_URL}/api/method/mob_clinic.mob_clinic.api.clinical_record.get_clinical_records?patient_id=${patientId}`, {
                                    credentials: 'include'
                                  })
                                    .then(res => res.json())
                                    .then(data => {
                                      if (data.message?.data) {
                                        setClinicalRecords(data.message.data);
                                      }
                                    })
                                    .finally(() => setClinicalRecordsLoading(false));
                                }
                              }}
                              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${recordsTab === 'clinical'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                              Clinical Records ({clinicalRecords?.length || 0})
                            </button>
                          </div>

                          {/* Prescriptions Tab */}
                          {recordsTab === 'prescriptions' && (
                            prescriptionsLoading ? (
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
                                            onClick={async (e) => {
                                              e.stopPropagation();

                                              let pdfDisplayData = displayData;

                                              // Fetch full details if medications are missing
                                              if (!pdfDisplayData.medications || pdfDisplayData.medications.length === 0) {
                                                try {
                                                  toast.loading('Preparing PDF...', { id: 'pdf-prep' });
                                                  const fullData = await prescriptionService.getPrescription(recordId);
                                                  pdfDisplayData = fullData;
                                                  toast.dismiss('pdf-prep');
                                                } catch (err) {
                                                  console.error("Failed to fetch prescription details for PDF", err);
                                                  toast.error("Failed to load full prescription details", { id: 'pdf-prep' });
                                                  return;
                                                }
                                              }

                                              const medications = (pdfDisplayData.medications || []).map((m: any) => ({
                                                medicine_name: m.drug_name || m.medicine_name,
                                                strength: m.dosage || '',
                                                frequency: m.frequency || m.interval || '',
                                                days: m.duration || m.period || '',
                                                condition: m.instruction || m.comment || '',
                                                comment: m.instructions || m.comment,
                                                morning: 0, lunch: 0, evening: 0, night: 0
                                              }));
                                              // Parse 1-0-1 format
                                              medications.forEach((m: any) => {
                                                if (m.frequency && /^\d+-\d+-\d+(-\d+)?$/.test(m.frequency)) {
                                                  const parts = m.frequency.split('-');
                                                  m.morning = parseInt(parts[0]) || 0;
                                                  m.lunch = parseInt(parts[1]) || 0;
                                                  // If 3 parts: Mor-Aft-Night (standard 1-0-1 is Morn-Aft-Night usually)
                                                  if (parts.length === 3) {
                                                    m.evening = parseInt(parts[2]) || 0;
                                                    m.night = m.evening; // Template uses evening/night logic
                                                  } else if (parts.length === 4) {
                                                    m.evening = parseInt(parts[2]) || 0;
                                                    m.night = parseInt(parts[3]) || 0;
                                                  }
                                                }
                                              });

                                              const data: PrescriptionPrintData = {
                                                patientName: pdfDisplayData.patient_name || patient?.patient_name || 'Patient',
                                                patientAge: patient?.age ? String(patient.age) : (pdfDisplayData.age ? String(pdfDisplayData.age) : ''),
                                                patientGender: patient?.sex || pdfDisplayData.gender || '',
                                                patientId: pdfDisplayData.patient || pdfDisplayData.patient_id || patient?.patient_id || patient?.name || patientId,
                                                doctorName: pdfDisplayData.practitioner_name || (user as any)?.full_name || 'Doctor', // User might need casting if strict
                                                clinicName: profile?.basic_info?.clinic_name || 'Dental Clinic',
                                                doctorRegNo: profile?.basic_info?.registration_number || '',
                                                doctorQualification: '', // Removed default static value
                                                clinicAddress: profile?.address ? `${profile.address.address_line1 || ''}, ${profile.address.city || ''}` : '',
                                                clinicPhone: profile?.basic_info?.phone,
                                                clinicEmail: profile?.basic_info?.email,
                                                clinicLogo: profile?.basic_info?.logo_url,
                                                prescriptionDate: new Date(pdfDisplayData.encounter_date || pdfDisplayData.posting_date || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
                                                diagnosis: pdfDisplayData.diagnosis || '',
                                                notes: pdfDisplayData.notes || '',
                                                medications: medications
                                              };
                                              downloadPrescriptionPDF(data);
                                            }}
                                            className="text-gray-500 hover:text-gray-700 p-1"
                                            title="Download PDF"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              toast.loading('Sending via WhatsApp...', { id: 'wa-rx' });
                                              const { whatsappService } = await import('../api/services/whatsapp');
                                              const res = await whatsappService.sendPrescription(recordId);
                                              if (res.success) {
                                                toast.success('Prescription sent via WhatsApp', { id: 'wa-rx' });
                                              } else {
                                                toast.error(res.error || 'Failed to send via WhatsApp', { id: 'wa-rx' });
                                              }
                                            }}
                                            className="text-green-600 hover:text-green-700 p-1"
                                            title="Share via WhatsApp"
                                          >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                          </button>
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
                                          {/* Medications */}
                                          {displayData.medications && displayData.medications.length > 0 && (
                                            <div>
                                              <h5 className="text-xs font-bold text-gray-700 mb-2">MEDICATIONS</h5>
                                              {editablePrescriptions.has(recordId) ? (
                                                /* Edit Mode */
                                                <div className="space-y-3">
                                                  {(editedPrescriptionData[recordId]?.medications || displayData.medications).map((medication: any, index: number) => (
                                                    <div key={index} className="p-3 border border-gray-200 rounded-lg bg-white">
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                          type="text"
                                                          value={medication.drug_name}
                                                          onChange={(e) => {
                                                            const meds = [...(editedPrescriptionData[recordId]?.medications || displayData.medications)];
                                                            meds[index] = { ...meds[index], drug_name: e.target.value };
                                                            handlePrescriptionFieldChange(recordId, 'medications', meds);
                                                          }}
                                                          placeholder="Drug name"
                                                          className="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                        <select
                                                          value={medication.form || medication.dosage_form || 'Tablet'}
                                                          onChange={(e) => {
                                                            const meds = [...(editedPrescriptionData[recordId]?.medications || displayData.medications)];
                                                            meds[index] = { ...meds[index], form: e.target.value };
                                                            handlePrescriptionFieldChange(recordId, 'medications', meds);
                                                          }}
                                                          className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                                        >
                                                          <option value="Tablet">Tablet</option>
                                                          <option value="Capsule">Capsule</option>
                                                          <option value="Syrup">Syrup</option>
                                                          <option value="Drops">Drops</option>
                                                          <option value="Injection">Injection</option>
                                                          <option value="Cream">Cream</option>
                                                          <option value="Ointment">Ointment</option>
                                                          <option value="Gel">Gel</option>
                                                          <option value="Powder">Powder</option>
                                                          <option value="Inhaler">Inhaler</option>
                                                          <option value="Suspension">Suspension</option>
                                                          <option value="Other">Other</option>
                                                        </select>
                                                        <input
                                                          type="text"
                                                          value={medication.dosage || ''}
                                                          onChange={(e) => {
                                                            const meds = [...(editedPrescriptionData[recordId]?.medications || displayData.medications)];
                                                            meds[index] = { ...meds[index], dosage: e.target.value };
                                                            handlePrescriptionFieldChange(recordId, 'medications', meds);
                                                          }}
                                                          placeholder="Dosage"
                                                          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                        <input
                                                          type="text"
                                                          value={medication.frequency || medication.interval || ''}
                                                          onChange={(e) => {
                                                            const meds = [...(editedPrescriptionData[recordId]?.medications || displayData.medications)];
                                                            meds[index] = { ...meds[index], frequency: e.target.value };
                                                            handlePrescriptionFieldChange(recordId, 'medications', meds);
                                                          }}
                                                          placeholder="Frequency"
                                                          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                        <input
                                                          type="text"
                                                          value={medication.duration || medication.period || ''}
                                                          onChange={(e) => {
                                                            const meds = [...(editedPrescriptionData[recordId]?.medications || displayData.medications)];
                                                            meds[index] = { ...meds[index], duration: e.target.value };
                                                            handlePrescriptionFieldChange(recordId, 'medications', meds);
                                                          }}
                                                          placeholder="Duration"
                                                          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                                        />
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                /* View Mode */
                                                <div className="space-y-2">
                                                  {displayData.medications.map((medication: any, index: number) => (
                                                    <div key={index} className="text-sm bg-green-50 p-3 rounded">
                                                      <div className="flex items-center justify-between">
                                                        <div className="font-semibold text-green-800">{medication.drug_name}</div>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                          {medication.form || medication.dosage_form || 'Tablet'}
                                                        </span>
                                                      </div>
                                                      <div className="text-xs text-gray-600 mt-1">
                                                        {medication.dosage && <span>{medication.dosage}</span>}
                                                        {(medication.frequency || medication.interval) && <span> • {medication.frequency || medication.interval}</span>}
                                                        {(medication.duration || medication.period) && <span> • {medication.duration || medication.period}</span>}
                                                      </div>
                                                      {(medication.instructions || medication.comment) && (
                                                        <div className="text-xs text-gray-500 mt-1 italic">{medication.instructions || medication.comment}</div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
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
                            )
                          )}

                          {/* Clinical Records Tab */}
                          {recordsTab === 'clinical' && (
                            clinicalRecordsLoading ? (
                              <div className="space-y-4">
                                {[1, 2].map((i) => (
                                  <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                  </div>
                                ))}
                              </div>
                            ) : clinicalRecords.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No clinical records available</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {clinicalRecords.map((record: any) => (
                                  <div key={record.name} className="border border-gray-200 rounded-lg p-4 hover:border-secondary-300 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-bold text-gray-700">
                                        {new Date(record.record_date || record.creation).toLocaleDateString()}
                                      </h4>
                                      <button
                                        onClick={async () => {
                                          if (!window.confirm('Are you sure you want to delete this clinical record?')) return;
                                          try {
                                            await fetch(`${API_BASE_URL}/api/method/mob_clinic.mob_clinic.api.clinical_record.delete_clinical_record`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              credentials: 'include',
                                              body: JSON.stringify({ record_id: record.name })
                                            });
                                            toast.success('Clinical record deleted');
                                            setClinicalRecords(prev => prev.filter(r => r.name !== record.name));
                                          } catch (e) {
                                            toast.error('Failed to delete clinical record');
                                          }
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                    {record.notes && (
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                        </Card>
                      </div>
                    )}

                    {/* Payments Content */}
                    {currentSection === 'payments' && (
                      <Card className="p-4 lg:p-6">
                        <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-4">Payment History</h3>
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
                              <div key={invoice.invoice_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                {/* Invoice Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900">{invoice.invoice_id || invoice.name}</h4>
                                    <span className="text-xs text-gray-500 block mt-0.5">
                                      {new Date(invoice.posting_date || invoice.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${invoice.status === 'Paid'
                                      ? 'bg-green-100 text-green-700'
                                      : invoice.status === 'Partially Paid'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-red-100 text-red-700'
                                      }`}>
                                      {invoice.status || (invoice.pending > 0 ? 'Unpaid' : 'Paid')}
                                    </span>
                                    {/* Delete Button (Icon only) */}
                                    <button
                                      onClick={() => handleDeleteInvoice(invoice.invoice_id || invoice.name)}
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                      title="Delete Invoice"
                                      disabled={deleteInvoiceMutation.isPending}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                                    <div className="text-sm font-bold text-gray-800">₹{(invoice.grand_total || invoice.amount || 0).toLocaleString()}</div>
                                    <div className="text-[10px] font-semibold text-gray-500 uppercase mt-0.5">Total</div>
                                  </div>
                                  <div className="bg-green-50 rounded-lg p-2.5 text-center">
                                    <div className="text-sm font-bold text-green-600">₹{(invoice.paid_amount || invoice.paid || (invoice.grand_total - invoice.outstanding_amount) || 0).toLocaleString()}</div>
                                    <div className="text-[10px] font-semibold text-green-700 uppercase mt-0.5">Paid</div>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-2.5 text-center">
                                    <div className="text-sm font-bold text-orange-600">₹{(invoice.pending || invoice.outstanding_amount || 0).toLocaleString()}</div>
                                    <div className="text-[10px] font-semibold text-orange-700 uppercase mt-0.5">Pending</div>
                                  </div>
                                </div>

                                {/* Payment History Section */}
                                {expandedInvoices.has(invoice.invoice_id || invoice.name) && (
                                  <div className="mb-4 pt-3 border-t border-gray-100">
                                    {loadingInvoiceDetails.has(invoice.invoice_id || invoice.name) ? (
                                      <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto"></div>
                                      </div>
                                    ) : invoiceDetails[invoice.invoice_id || invoice.name]?.payments?.length > 0 ? (
                                      <div className="space-y-2">
                                        <h5 className="text-[10px] uppercase font-bold text-gray-500 mb-2">History</h5>
                                        {invoiceDetails[invoice.invoice_id || invoice.name].payments.map((payment: any, idx: number) => (
                                          <div key={payment.payment_id || idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <div className="flex justify-between items-start mb-1">
                                              <div>
                                                <span className="text-xs font-bold text-gray-800 block">₹{payment.paid_amount.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-500">{payment.mode_of_payment}</span>
                                              </div>
                                              <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] text-gray-400">{new Date(payment.posting_date).toLocaleDateString()}</span>
                                                <button
                                                  onClick={() => handlePrintReceipt(payment, invoiceDetails[invoice.invoice_id || invoice.name])}
                                                  className="text-primary-600 text-[10px] font-medium hover:underline flex items-center gap-1"
                                                >
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                  </svg>
                                                  Receipt
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-2 text-xs text-gray-400 italic">No payments recorded</div>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                                  {((invoice.outstanding_amount && invoice.outstanding_amount > 0) || (invoice.pending && invoice.pending > 0)) ? (
                                    <Button
                                      size="sm"
                                      className="w-full bg-primary-600 hover:bg-primary-700 text-white border-0"
                                      onClick={() => handleOpenPaymentModal(invoice)}
                                    >
                                      Pay Now
                                    </Button>
                                  ) : (
                                    <div className="hidden"></div> /* Spacer if paid */
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`flex items-center gap-1 ${((invoice.outstanding_amount && invoice.outstanding_amount > 0) || (invoice.pending && invoice.pending > 0)) ? '' : 'flex-1'}`}
                                    onClick={() => toggleInvoiceExpansion(invoice.invoice_id || invoice.name)}
                                  >
                                    {expandedInvoices.has(invoice.invoice_id || invoice.name) ? 'Hide' : 'History'}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-3"
                                    onClick={() => handlePrintInvoice(invoice)}
                                    title="Print Invoice"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
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

            {/* Image Viewer Modal */}
            <ImageViewerModal
              isOpen={imageViewerOpen}
              onClose={() => setImageViewerOpen(false)}
              images={viewerImages}
              initialIndex={viewerInitialIndex}
            />

            {/* Create Prescription Modal - New Table Layout */}
            <PrescriptionModal
              isOpen={showNewPrescriptionModal}
              onClose={() => setShowNewPrescriptionModal(false)}
              patientId={patientId || ''}
              patientName={patient?.patient_name || patientId || ''}
              onSubmit={handleNewPrescriptionSubmit}
              isSubmitting={isCreating}
            />

            {/* Create Invoice Modal */}
            <CreateInvoiceModal
              isOpen={showCreateInvoiceModal}
              onClose={() => setShowCreateInvoiceModal(false)}
              appointment={appointmentId ? {
                name: appointmentId,
                patient: patientId,
                patient_name: patient?.patient_name || patient?.name
              } : undefined}
              onSubmit={handleCreateInvoiceSubmit}
              isCreating={isCreatingInvoice}
            />

            {/* File Upload Modal (DRY: shared component) */}
            <FileUploadModal
              isOpen={showFileUploadModal}
              onClose={() => setShowFileUploadModal(false)}
              referenceDoctype={appointmentId ? 'Patient Appointment' : 'Patient'}
              referenceName={appointmentId || patientId || ''}
              title="Upload Files"
              subtitle={patient?.patient_name || patientId}
              onUploadComplete={async () => {
                // Refresh patient files after upload
                if (patientId) {
                  const files = await fileUploadService.getPatientFiles(patientId);
                  setPatientFiles(files);
                }
              }}
            />

            {/* Clinical Record Modal */}
            {showClinicalRecordModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                      </svg>
                      Case Diary
                    </h3>
                    <button
                      onClick={() => setShowClinicalRecordModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={newClinicalRecord.notes}
                      onChange={(e) => setNewClinicalRecord({ notes: e.target.value })}
                      placeholder="Enter surgical history notes, procedures, and dates here..."
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y"
                    />
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        if (!newClinicalRecord.notes?.trim()) {
                          toast.error('Please enter some notes');
                          return;
                        }
                        setIsCreatingClinicalRecord(true);
                        try {
                          const response = await fetch(`${API_BASE_URL}/api/method/mob_clinic.mob_clinic.api.clinical_record.create_clinical_record`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              patient_id: patientId,
                              notes: newClinicalRecord.notes
                            })
                          });
                          const data = await response.json();
                          if (data.message?.message === 'Clinical record created successfully') {
                            toast.success('Notes saved');
                            setClinicalRecordsLoading(true);
                            try {
                              const refreshRes = await fetch(`${API_BASE_URL}/api/method/mob_clinic.mob_clinic.api.clinical_record.get_clinical_records?patient_id=${patientId}`, {
                                credentials: 'include'
                              });
                              const refreshData = await refreshRes.json();
                              if (refreshData.message?.data) {
                                setClinicalRecords(refreshData.message.data);
                              }
                            } finally {
                              setClinicalRecordsLoading(false);
                            }
                            setShowClinicalRecordModal(false);
                            setNewClinicalRecord({ notes: '' });
                          } else {
                            toast.error('Failed to save notes');
                          }
                        } catch (e) {
                          toast.error('Failed to save notes');
                        } finally {
                          setIsCreatingClinicalRecord(false);
                        }
                      }}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      disabled={isCreatingClinicalRecord}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isCreatingClinicalRecord ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Medical History Edit Modal */}
            {
              showMedicalHistoryEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">Edit Medical History</h3>
                      <button
                        onClick={() => setShowMedicalHistoryEdit(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                      <label className="flex items-center gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <input
                          type="checkbox"
                          checked={editableMedicalHistory.nrmh || false}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, nrmh: e.target.checked })}
                          className="w-5 h-5 text-primary-600"
                        />
                        <span className="text-sm font-medium">No Relevant Medical History (NRMH)</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editableMedicalHistory.diabetic || false}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, diabetic: e.target.checked })}
                          className="w-5 h-5 text-primary-600"
                        />
                        <span className="text-sm font-medium">Diabetic</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editableMedicalHistory.cardiac_history || false}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, cardiac_history: e.target.checked })}
                          className="w-5 h-5 text-primary-600"
                        />
                        <span className="text-sm font-medium">Cardiac History</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editableMedicalHistory.allergies || false}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, allergies: e.target.checked })}
                          className="w-5 h-5 text-primary-600"
                        />
                        <span className="text-sm font-medium">Allergies</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editableMedicalHistory.family_heart_disease || false}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, family_heart_disease: e.target.checked })}
                          className="w-5 h-5 text-primary-600"
                        />
                        <span className="text-sm font-medium">Family Heart Disease</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editableMedicalHistory.covid_vaccinated || false}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, covid_vaccinated: e.target.checked })}
                          className="w-5 h-5 text-primary-600"
                        />
                        <span className="text-sm font-medium">COVID Vaccinated</span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                        <select
                          value={editableMedicalHistory.blood_pressure || 'Normal'}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, blood_pressure: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Notes</label>
                        <textarea
                          value={editableMedicalHistory.other || ''}
                          onChange={(e) => setEditableMedicalHistory({ ...editableMedicalHistory, other: e.target.value })}
                          placeholder="Any other medical history..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 flex gap-3">
                      <button
                        onClick={() => setShowMedicalHistoryEdit(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Save to backend
                            const response = await fetch(`${API_BASE_URL}/api/method/mob_clinic.mob_clinic.api.patient.update_patient`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({
                                patient_id: patientId,
                                medical_history: JSON.stringify(editableMedicalHistory)
                              })
                            });
                            if (response.ok) {
                              toast.success('Medical history updated');
                              setShowMedicalHistoryEdit(false);
                              window.location.reload(); // Refresh to get updated data
                            } else {
                              toast.error('Failed to update medical history');
                            }
                          } catch (e) {
                            toast.error('Failed to update medical history');
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            {/* Fixed Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          </div >
        </MobileContainer >


      </div >
      {/* Edit Patient Modal */}
      {patient && (
        <EditPatientModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          patient={patient}
        />
      )}
    </div >
  );
};

export default PrescriptionPage;
