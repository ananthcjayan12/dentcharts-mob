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
import { usePatientInvoices, usePaymentSummary } from '../hooks/usePayments';
import toast from 'react-hot-toast';

const PrescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [currentSection, setCurrentSection] = useState<'medical' | 'payments'>('medical');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadNotes, setUploadNotes] = useState('');

  // API hooks
  const { data: patient, isLoading: patientLoading } = usePatient(patientId || '', !!patientId);
  const { data: prescriptions, isLoading: prescriptionsLoading } = usePatientPrescriptions(patientId || '');
  const { data: invoices, isLoading: invoicesLoading } = usePatientInvoices(patientId || '');
  const { data: paymentSummary, isLoading: paymentSummaryLoading } = usePaymentSummary(patientId || '');
  
  const { mutate: createPrescription, isPending: isCreating } = useCreatePrescription();
  const { mutate: updatePrescription, isPending: isUpdating } = useUpdatePrescription();

  const isLoading = patientLoading || prescriptionsLoading || invoicesLoading || paymentSummaryLoading;

  // Local state for UI interactions
  const [expandedPrescriptions, setExpandedPrescriptions] = useState<Set<string>>(new Set());
  const [editablePrescriptions, setEditablePrescriptions] = useState<Set<string>>(new Set());

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
                  <div className="font-bold">₹{paymentSummary?.paid_amount?.toLocaleString() || '0'}</div>
                  <div className="text-white/80">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-200">₹{paymentSummary?.outstanding_amount?.toLocaleString() || '0'}</div>
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
                  <p className="text-gray-500">No medical history available</p>
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
                      ₹{(paymentSummary.paid_amount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 font-lato mt-1">Total Paid</div>
                  </Card>
                  <Card className="text-center">
                    <div className="text-2xl font-bold text-red-600 font-lato">
                      ₹{(paymentSummary.outstanding_amount || 0).toLocaleString()}
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
              ) : !invoices || invoices.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-gray-500">No payment history available</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
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
                          {invoice.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-lato">
                        {new Date(invoice.posting_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 font-montserrat">
                        <strong>Patient:</strong> {invoice.patient_name}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-bold text-gray-700">₹{invoice.grand_total.toLocaleString()}</div>
                          <div className="text-gray-500">Total</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-600">₹{(invoice.grand_total - invoice.outstanding_amount).toLocaleString()}</div>
                          <div className="text-gray-500">Paid</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="font-bold text-red-600">₹{invoice.outstanding_amount.toLocaleString()}</div>
                          <div className="text-gray-500">Pending</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 font-montserrat">
                        <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}
                      </div>

                      {invoice.outstanding_amount > 0 && (
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="primary"
                            className="flex-1"
                            onClick={() => {
                              alert(`Recording payment for ${invoice.invoice_id}`);
                            }}
                          >
                            Record Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              alert(`Sending reminder for ${invoice.invoice_id}`);
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
            <div className="bg-white rounded-xl p-6 w-full max-w-sm max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 font-lato">
                  Upload Report
                </h3>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Date Selection */}
                <InputField
                  label="Report Date"
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                />

                {/* Upload Actions */}
                <div className="flex space-x-4">
                  <Button size="sm" variant="primary" className="flex-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </Button>
                  <Button size="sm" variant="primary" className="flex-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Files
                  </Button>
                </div>

                {/* File Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded mx-auto mb-2 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 font-montserrat">
                      Prescription<br />
                      {new Date(uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center p-3 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded mx-auto mb-2 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 font-montserrat">
                      X-ray<br />
                      {new Date(uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Add any additional notes about the reports..."
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
                      setUploadNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    className="flex-1"
                    onClick={() => {
                      // Here you would handle the actual upload
                      console.log('Uploading report:', {
                        date: uploadDate,
                        notes: uploadNotes,
                        patientId: patientId
                      });
                      setShowUpload(false);
                      setUploadNotes('');
                      alert('Report uploaded successfully!');
                    }}
                  >
                    Save Report
                  </Button>
                </div>
              </div>
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
