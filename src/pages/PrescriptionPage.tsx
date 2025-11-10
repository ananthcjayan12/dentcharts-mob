import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { usePatient } from '../hooks/usePatients';
import { usePatientPrescriptions, useCreatePrescription, useUpdatePrescription } from '../hooks/usePrescriptions';
import { usePatientInvoices, usePaymentSummary, useRecordPayment } from '../hooks/usePayments';
import { fileUploadService } from '../api/services/fileUpload';
import toast from 'react-hot-toast';

const PrescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId: rawPatientId } = useParams<{ patientId: string }>();
  
  // Decode the patientId from URL (e.g., "Ananth.C%20Jayan" -> "Ananth.C Jayan")
  const patientId = rawPatientId ? decodeURIComponent(rawPatientId) : undefined;
  
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [currentSection, setCurrentSection] = useState<'medical' | 'payments'>('medical');
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

  // API hooks
  const { data: patient, isLoading: patientLoading } = usePatient(patientId || '', !!patientId);
  const { data: prescriptions, isLoading: prescriptionsLoading } = usePatientPrescriptions(patientId || '');
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

  const isLoading = patientLoading || prescriptionsLoading || invoicesLoading || paymentSummaryLoading;

  // Local state for UI interactions
  const [expandedPrescriptions, setExpandedPrescriptions] = useState<Set<string>>(new Set());
  const [editablePrescriptions, setEditablePrescriptions] = useState<Set<string>>(new Set());

  // Fetch patient files when component mounts or patientId changes
  React.useEffect(() => {
    const fetchPatientFiles = async () => {
      if (!patientId) return;
      
      setIsLoadingFiles(true);
      try {
        const files = await fileUploadService.getPatientFiles(patientId);
        setPatientFiles(files);
      } catch (error) {
        console.error('Error fetching patient files:', error);
        toast.error('Failed to load patient files');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchPatientFiles();
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
        navigate('/appointments/new');
        break;
      default:
        break;
    }
  };

  const togglePrescription = (recordId: string) => {
    setExpandedPrescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const toggleEdit = (recordId: string) => {
    setEditablePrescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleNewAppointment = () => {
    // Navigate to new appointment page with patient ID pre-filled
    navigate(`/appointments/new?patientId=${patientId}`);
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
  };

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    input.onchange = (e: any) => handleFileSelect(e);
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
          reference_doctype: 'Patient',
          reference_name: patientId || '',
          is_private: true,
        })
      );

      const results = await Promise.all(uploadPromises);
      
      setUploadedFiles(prev => [...prev, ...results]);
      toast.success(`Successfully uploaded ${results.length} file(s)`);
      
      // Refresh patient files list
      const files = await fileUploadService.getPatientFiles(patientId || '');
      setPatientFiles(files);
      
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
        invoice_id: selectedInvoice.invoice_id,
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

  return (
    <MobileContainer>
      <div className="min-h-screen bg-white relative">
        <TopBar 
          title={`PID - ${patientId || '201892521'}`}
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="px-6 space-y-6">
          {/* Patient Header */}
          <div className="bg-gradient-to-r from-primary-500 to-green-400 rounded-xl p-4 text-white">
            {patientLoading ? (
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
                  <span className="text-white font-bold text-lg">
                    {patient.patient_name?.split(' ')[0]?.[0]}{patient.patient_name?.split(' ')[1]?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold font-lato mb-1">
                    History for<br />
                    {patient.patient_name}
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
              className={`flex-1 py-2 px-4 rounded-md text-sm font-bold font-lato transition-colors ${
                currentSection === 'medical'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Medical History
            </button>
            <button
              onClick={() => setCurrentSection('payments')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-bold font-lato transition-colors ${
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
                  
                  {/* Horizontal scrollable image gallery - Instagram Reel size */}
                  {filteredFiles.length > 0 ? (
                    <>
                      <div className="overflow-x-auto pb-2 -mx-6 px-6">
                        <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
                          {filteredFiles.map((file: any) => (
                            <div key={file.file_id} className="flex-shrink-0 w-80">
                              <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                                {/* Image preview - Instagram post size */}
                                {fileUploadService.isImageFile(file.file_name) ? (
                                  <div 
                                    className="relative w-full h-96 bg-gray-100 overflow-hidden cursor-pointer group"
                                    onClick={() => setFullscreenImage(`http://dev2.localhost:8800${file.file_url}`)}
                                  >
                                    <img
                                      src={`http://dev2.localhost:8800${file.file_url}`}
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
                                  <div className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
                                    <div className="text-8xl mb-4">
                                      {fileUploadService.getFileIcon(file.file_name)}
                                    </div>
                                    <span className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full font-semibold capitalize shadow-sm">
                                      {file.file_category || 'document'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* File details */}
                                <div className="p-4">
                                  <p className="text-sm font-semibold text-gray-900 truncate mb-2">
                                    {file.file_name}
                                  </p>
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
                                      href={`http://dev2.localhost:8800${file.file_url}`}
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
                                      href={`http://dev2.localhost:8800${file.download_url}`}
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

              {/* Prescriptions Section */}
              <h4 className="text-sm font-bold text-gray-700 font-lato mb-3">
                Prescriptions & Clinical Records
              </h4>

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

              <div className="space-y-4">
                {prescriptions?.map((prescription) => (
                <Card key={prescription.record_id} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-600 font-lato">
                      {new Date(prescription.posting_date).toLocaleDateString()}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => toggleEdit(prescription.record_id)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Edit prescription"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => togglePrescription(prescription.record_id)}
                        className="text-gray-400 transform transition-transform duration-200"
                      >
                        <svg 
                          className={`w-4 h-4 ${expandedPrescriptions.has(prescription.record_id) ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {expandedPrescriptions.has(prescription.record_id) && (
                    <div className="space-y-4">
                      {/* Investigations Section */}
                      <div className="pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          INVESTIGATIONS
                        </h5>
                        {editablePrescriptions.has(prescription.record_id) ? (
                          <div className="space-y-2">
                            {prescription.investigations?.map((investigation, index) => (
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
                            {prescription.investigations?.map((investigation, index) => (
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
                      <div className="pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          MEDICATIONS
                        </h5>
                        {editablePrescriptions.has(prescription.record_id) ? (
                          <div className="space-y-2">
                            {prescription.medications?.map((medication, index) => (
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
                            {prescription.medications?.map((medication, index) => (
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
                      <div className="pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          CLINICAL DETAILS
                        </h5>
                        <div className="space-y-3 text-sm font-montserrat">
                          <div>
                            <span className="font-semibold text-gray-700">Chief Complaint:</span>
                            <p className="text-gray-900 mt-1">{prescription.chief_complaint}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Symptoms:</span>
                            <p className="text-gray-900 mt-1">{prescription.symptoms}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Diagnosis:</span>
                            <p className="text-gray-900 mt-1">{prescription.diagnosis}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Treatment Plan:</span>
                            <p className="text-gray-900 mt-1">{prescription.treatment_plan}</p>
                          </div>
                        </div>
                      </div>

                      {/* Document Preview */}
                      <div className="pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          ATTACHED DOCUMENTS
                        </h5>
                        <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Document Preview</span>
                        </div>
                      </div>

                                            {/* Action Buttons for Edit Mode */}
                      {editablePrescriptions.has(prescription.record_id) && (
                        <div className="flex space-x-2 pt-4 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEdit(prescription.record_id)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Save changes - implement actual API call here
                              toggleEdit(prescription.record_id);
                            }}
                            className="text-xs"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
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
                <div className="space-y-4">
                  {displayInvoices.map((invoice: any) => (
                  <Card key={invoice.invoice_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-bold text-gray-700 font-lato">
                          {invoice.invoice_id}
                        </h5>
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
                      <span className="text-xs text-gray-500 font-lato">
                        {new Date(invoice.posting_date || invoice.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 font-montserrat">
                        <strong>Patient:</strong> {invoice.patient_name || patient?.patient_name}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-bold text-gray-700">₹{(invoice.grand_total || invoice.amount || 0).toLocaleString()}</div>
                          <div className="text-gray-500">Total</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-600">₹{(invoice.paid || (invoice.grand_total - invoice.outstanding_amount) || 0).toLocaleString()}</div>
                          <div className="text-gray-500">Paid</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="font-bold text-red-600">₹{(invoice.pending || invoice.outstanding_amount || 0).toLocaleString()}</div>
                          <div className="text-gray-500">Pending</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 font-montserrat">
                        <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}
                      </div>

                      {((invoice.outstanding_amount && invoice.outstanding_amount > 0) || (invoice.pending && invoice.pending > 0)) && (
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="primary"
                            className="flex-1"
                            onClick={() => handleOpenPaymentModal(invoice)}
                          >
                            Record Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              toast('Payment reminder feature coming soon');
                            }}
                          >
                            Send Reminder
                          </Button>
                        </div>
                      )}
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
                    onClick={() => navigate('/invoice')}
                    className="flex flex-col items-center py-3"
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
                    className="flex flex-col items-center py-3"
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
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    className="flex-1"
                    onClick={handleUploadFiles}
                    disabled={isUploading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
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

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default PrescriptionPage;
