import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { usePatients } from '../hooks/usePatients';
import { useCreateAppointment, useAvailableSlots } from '../hooks/useAppointments';
import { Patient } from '../types';
import toast from 'react-hot-toast';

const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('new-appointment');
  const [selectedPatient, setSelectedPatient] = useState<any>(null); // Using PatientResponse type
  const [showPatientList, setShowPatientList] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    duration: 30,
    notes: ''
  });

  // API hooks
  const { data: patientsData, isLoading: patientsLoading } = usePatients();
  const { mutate: createAppointment, isPending: isCreating } = useCreateAppointment();
  
  const patients = patientsData?.data || [];

  // Check if patient ID is provided in URL params (from prescription page)
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.patient_id === patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [searchParams, patients]);

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/home');
        break;
      case 'appointments':
        navigate('/appointments');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!selectedPatient || !formData.appointment_date || !formData.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const appointmentData = {
      patient_id: selectedPatient.patient_id,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      duration: formData.duration,
      notes: formData.notes || undefined,
    };

    createAppointment(appointmentData, {
      onSuccess: () => {
        toast.success('Appointment created successfully!');
        navigate('/appointments');
      },
      onError: (error) => {
        console.error('Error creating appointment:', error);
        toast.error('Failed to create appointment. Please try again.');
      }
    });
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50">
        <TopBar 
          title="New Appointment"
          onBack={() => navigate('/appointments')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="px-6 space-y-6">
          {/* Patient Selection */}
          <Card>
            <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
              Select Patient
            </h3>
            
            {selectedPatient ? (
              <div 
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer"
                onClick={() => setShowPatientList(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedPatient.patient_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-lato">
                      {selectedPatient.patient_name}
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      ID: {selectedPatient.patient_id} • {selectedPatient.sex} • {selectedPatient.mobile}
                    </p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowPatientList(true)}
                className="w-full"
              >
                Choose Patient
              </Button>
            )}
          </Card>

          {/* Appointment Details */}
          {selectedPatient && (
            <Card>
              <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
                Appointment Details
              </h3>

              <div className="space-y-4">
                <InputField
                  label="Date *"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                  required
                />

                <InputField
                  label="Time *"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleInputChange('appointment_time', e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Duration (minutes) *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
                    required
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes or special instructions..."
                    className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Appointment'}
                </Button>
              </div>
            </Card>
          )}
          </div>
        </div>

        {/* Patient Selection Modal */}
        {showPatientList && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-96 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 font-lato">
                  Select Patient
                </h3>
                <button
                  onClick={() => setShowPatientList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto max-h-64 space-y-2">
                {patientsLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-24"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                      </div>
                    </div>
                  ))
                ) : patients.length > 0 ? (
                  patients.map((patient) => (
                    <div
                      key={patient.patient_id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowPatientList(false);
                      }}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {patient.patient_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 font-lato">
                          {patient.patient_name}
                        </p>
                        <p className="text-xs text-gray-600 font-montserrat">
                          ID: {patient.patient_id} • {patient.sex} • {patient.mobile}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No patients found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default NewAppointmentPage;
