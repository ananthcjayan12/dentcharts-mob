import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { usePatients } from '../hooks/usePatients';
import { useCreateAppointment } from '../hooks/useAppointments';
import toast from 'react-hot-toast';

const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('Dr Avinash');
  const [appointmentType, setAppointmentType] = useState<'date' | 'today'>('today');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    duration: 30,
    notes: ''
  });

  // API hooks
  const { data: patientsData, isLoading: patientsLoading } = usePatients();
  const { mutate: createAppointment, isPending: isCreating } = useCreateAppointment();
  
  const patients = patientsData?.data || [];

  // Check if patient ID is provided in URL params
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const dateParam = searchParams.get('date');
    
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.name === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setShowPatientList(false);
      }
    }
    
    if (dateParam) {
      setFormData(prev => ({ ...prev, appointment_date: dateParam }));
      setAppointmentType('date');
    }
  }, [searchParams, patients]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (appointmentType === 'date' && !formData.appointment_date) {
      toast.error('Please select a date');
      return;
    }

    const appointmentData = {
      patient_id: selectedPatient.name,
      appointment_date: appointmentType === 'today' 
        ? new Date().toISOString().split('T')[0] 
        : formData.appointment_date,
      appointment_time: formData.appointment_time || '09:00',
      duration: formData.duration,
      notes: formData.notes || undefined,
    };

    createAppointment(appointmentData, {
      onSuccess: () => {
        toast.success('Appointment created successfully!');
        if (sendWhatsApp) {
          toast.success('WhatsApp confirmation sent!');
        }
        navigate('/appointments');
      },
      onError: (error) => {
        console.error('Error creating appointment:', error);
        toast.error('Failed to create appointment. Please try again.');
      }
    });
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-xl w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:my-8 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 pr-4">
            Search and book appointments
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-6 py-4 max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Search Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="relative">
              <input
                type="text"
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  if (e.target.value) setShowPatientList(true);
                }}
                onClick={() => setShowPatientList(true)}
                placeholder="Search patient by name, ID, or phone"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={() => navigate('/patients/new')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Patient</span>
            </button>
          </div>

          {/* Patient List Table */}
          {showPatientList && (
            <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Full Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Mobile Number</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Loading patients...
                        </td>
                      </tr>
                    ) : patients.filter(p => 
                        p.patient_name?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        p.patient_id?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        p.mobile?.includes(patientSearchQuery)
                      ).length > 0 ? (
                      patients.filter(p => 
                        p.patient_name?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        p.patient_id?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        p.mobile?.includes(patientSearchQuery)
                      ).slice(0, 5).map((patient) => (
                        <tr key={patient.patient_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{patient.patient_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{patient.address?.split(',')[0] || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{patient.mobile}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Dr Harish</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPatientList(false);
                                setPatientSearchQuery(patient.patient_name);
                              }}
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-gray-500">No patients found</p>
                            <button
                              onClick={() => navigate('/patients/new')}
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create New Patient
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden bg-white">
                {patientsLoading ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    Loading patients...
                  </div>
                ) : patients.filter(p => 
                    p.patient_name?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                    p.patient_id?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                    p.mobile?.includes(patientSearchQuery)
                  ).length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {patients.filter(p => 
                      p.patient_name?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                      p.patient_id?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                      p.mobile?.includes(patientSearchQuery)
                    ).slice(0, 5).map((patient) => (
                      <div key={patient.patient_id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              {patient.patient_name}
                            </h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p>📍 {patient.address?.split(',')[0] || 'N/A'}</p>
                              <p>📱 {patient.mobile}</p>
                              <p>👨‍⚕️ Dr Harish</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowPatientList(false);
                              setPatientSearchQuery(patient.patient_name);
                            }}
                            className="ml-3 px-3 py-1.5 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-gray-500 mb-3">No patients found</p>
                    <button
                      onClick={() => navigate('/patients/new')}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New Patient
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor Selection & Appointment Settings */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Select Doctor */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Select Doctor</h3>
                <div className="flex flex-wrap gap-2">
                  {['Dr Avinash', 'Dr Prasad', 'Dr Harish'].map((doctor) => (
                    <button
                      key={doctor}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        selectedDoctor === doctor
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {doctor}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Appointment */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Set Appointment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setAppointmentType('date')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                      appointmentType === 'date'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Select Date</span>
                  </button>
                  
                  <button
                    onClick={() => setAppointmentType('today')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                      appointmentType === 'today'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Add to Todays Queue</span>
                  </button>
                </div>

                {appointmentType === 'date' && (
                  <div className="mt-4">
                    <input
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>

              {/* WhatsApp Confirmation */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="whatsapp"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="whatsapp" className="text-sm text-gray-700 cursor-pointer">
                  Send WhatsApp Confirmation
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {selectedPatient && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isCreating ? 'Booking...' : 'Book Appointment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAppointmentPage;
