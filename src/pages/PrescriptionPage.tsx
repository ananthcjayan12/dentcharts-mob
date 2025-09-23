import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';

// Mock data
const mockPatient = {
  id: 'P0001',
  name: 'Sample Patient Name',
  age: 52,
  phone: '01881446559',
  address: 'NA',
  treatmentDate: '25/09/2018',
  avatar: '/api/placeholder/50/50'
};

const mockPrescriptions = [
  {
    id: '1',
    date: '25-01-2025',
    expanded: false,
    editable: false,
    investigations: [
      '1. Complete Blood Count (CBC)',
      '2. Blood Sugar Level (Fasting)',
      '3. Dental X-Ray'
    ],
    medications: [
      'Paracetamol 500mg - 2 times daily for 3 days',
      'Amoxicillin 250mg - 3 times daily for 5 days'
    ],
    notes: 'Patient shows good response to treatment. Continue medication as prescribed.'
  },
  {
    id: '2',
    date: '05-12-2024',
    expanded: true,
    editable: false,
    investigations: [
      '1. Activated Partial thromboplastin time (APTT)',
      '2. Dehydroepiandrosterone sulphate (blood)',
      '3. CA 125 (Serum)'
    ],
    medications: [
      'Metronidazole 400mg - 3 times daily for 7 days',
      'Chlorhexidine mouthwash - twice daily'
    ],
    notes: 'Monitor for allergic reactions. Follow-up in 1 week.'
  },
  {
    id: '3',
    date: '19-12-2024',
    expanded: false,
    editable: false,
    investigations: [
      '1. Panoramic X-Ray',
      '2. Blood Pressure Check'
    ],
    medications: [
      'Ibuprofen 400mg - as needed for pain',
      'Antiseptic mouthwash - after meals'
    ],
    notes: 'Regular checkup completed. Next visit in 6 months.'
  }
];

const PrescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadNotes, setUploadNotes] = useState('');

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

  const togglePrescription = (id: string) => {
    setPrescriptions(prev => 
      prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p)
    );
  };

  const toggleEdit = (id: string) => {
    setPrescriptions(prev => 
      prev.map(p => p.id === id ? { ...p, editable: !p.editable } : p)
    );
  };

  const updatePrescriptionField = (id: string, field: string, value: string | string[]) => {
    setPrescriptions(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const handleNewAppointment = () => {
    // Navigate to new appointment page with patient ID pre-filled
    navigate(`/appointments/new?patientId=${patientId}`);
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-white pb-20 relative">
        <TopBar 
          title={`PID - ${patientId || '201892521'}`}
          onBack={() => navigate('/home')}
          showMenu
        />

        <div className="px-6 space-y-6">
          {/* Patient Header */}
          <div className="bg-gradient-to-r from-primary-500 to-green-400 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src={mockPatient.avatar} 
                  alt={mockPatient.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold font-lato mb-1">
                  History for<br />
                  {mockPatient.name}
                </h2>
                <div className="text-xs font-lato space-y-1">
                  <div className="flex justify-between">
                    <span>Patient id: {mockPatient.id}</span>
                    <span>Phone: {mockPatient.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Age: {mockPatient.age}</span>
                    <span>Treatment Date: {mockPatient.treatmentDate}</span>
                  </div>
                  <div>
                    <span>Address: {mockPatient.address}</span>
                  </div>
                </div>
              </div>
            </div>
            
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
          </div>

          {/* Existing Chambers */}
          <div>
            <h3 className="text-base font-bold text-gray-700 font-lato mb-4">
              Existing Chambers
            </h3>

            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-600 font-lato">
                      {prescription.date}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => toggleEdit(prescription.id)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Edit prescription"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => togglePrescription(prescription.id)}
                        className="text-gray-400 transform transition-transform duration-200"
                      >
                        <svg 
                          className={`w-4 h-4 ${prescription.expanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {prescription.expanded && (
                    <div className="space-y-4">
                      {/* Investigations Section */}
                      <div className="pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          INVESTIGATIONS
                        </h5>
                        {prescription.editable ? (
                          <div className="space-y-2">
                            {prescription.investigations?.map((investigation, index) => (
                              <input
                                key={index}
                                type="text"
                                value={investigation}
                                onChange={(e) => {
                                  const updated = [...(prescription.investigations || [])];
                                  updated[index] = e.target.value;
                                  updatePrescriptionField(prescription.id, 'investigations', updated);
                                }}
                                className="w-full p-2 border border-gray-300 rounded text-sm font-montserrat"
                              />
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const updated = [...(prescription.investigations || []), ''];
                                updatePrescriptionField(prescription.id, 'investigations', updated);
                              }}
                              className="text-xs"
                            >
                              Add Investigation
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {prescription.investigations?.map((investigation, index) => (
                              <p key={index} className="text-sm text-black font-montserrat">
                                {investigation}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Medications Section */}
                      <div className="pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          MEDICATIONS
                        </h5>
                        {prescription.editable ? (
                          <div className="space-y-2">
                            {prescription.medications?.map((medication, index) => (
                              <input
                                key={index}
                                type="text"
                                value={medication}
                                onChange={(e) => {
                                  const updated = [...(prescription.medications || [])];
                                  updated[index] = e.target.value;
                                  updatePrescriptionField(prescription.id, 'medications', updated);
                                }}
                                className="w-full p-2 border border-gray-300 rounded text-sm font-montserrat"
                              />
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const updated = [...(prescription.medications || []), ''];
                                updatePrescriptionField(prescription.id, 'medications', updated);
                              }}
                              className="text-xs"
                            >
                              Add Medication
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {prescription.medications?.map((medication, index) => (
                              <p key={index} className="text-sm text-green-700 font-montserrat">
                                {medication}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Notes Section */}
                      <div className="pt-4 border-t border-gray-100">
                        <h5 className="text-xs font-bold text-gray-700 font-lato mb-2">
                          NOTES
                        </h5>
                        {prescription.editable ? (
                          <textarea
                            value={prescription.notes || ''}
                            onChange={(e) => updatePrescriptionField(prescription.id, 'notes', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm font-montserrat"
                            rows={3}
                            placeholder="Add notes..."
                          />
                        ) : (
                          <p className="text-sm text-gray-700 font-montserrat">
                            {prescription.notes || 'No notes available'}
                          </p>
                        )}
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
                      {prescription.editable && (
                        <div className="flex space-x-2 pt-4 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEdit(prescription.id)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              toggleEdit(prescription.id);
                              // Here you would save the changes to backend
                              console.log('Saving prescription changes:', prescription);
                            }}
                            className="flex-1"
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

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default PrescriptionPage;
