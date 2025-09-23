import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { mockPatients } from '../data/mockData';
import { Patient } from '../types';

const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('new-appointment');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    notes: ''
  });

  // Check if patient ID is provided in URL params (from prescription page)
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId) {
      const patient = mockPatients.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [searchParams]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!selectedPatient || !formData.date || !formData.time || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    // In a real app, this would save to backend
    console.log('Creating appointment:', {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      ...formData,
      status: 'pending'
    });

    alert('Appointment created successfully!');
    navigate('/appointments');
  };

  const appointmentTypes = [
    'Regular checkup',
    'Follow-up',
    'Dental cleaning',
    'Consultation',
    'Treatment',
    'Emergency',
    'Root canal',
    'Extraction',
    'Filling',
    'Orthodontic'
  ];

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopBar 
          title="New Appointment"
          onBack={() => navigate('/appointments')}
          showMenu
        />

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
                      {selectedPatient.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-lato">
                      {selectedPatient.name}
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      ID: {selectedPatient.id} • Age: {selectedPatient.age}
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
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />

                <InputField
                  label="Time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Appointment Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
                    required
                  >
                    <option value="">Select type...</option>
                    {appointmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
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
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                >
                  Create Appointment
                </Button>
              </div>
            </Card>
          )}
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
                {mockPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowPatientList(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 font-lato">
                        {patient.name}
                      </p>
                      <p className="text-xs text-gray-600 font-montserrat">
                        ID: {patient.id} • Age: {patient.age} • {patient.phone}
                      </p>
                    </div>
                  </div>
                ))}
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
