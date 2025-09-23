import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { mockPatients } from '../data/mockData';
import { Patient } from '../types';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'male' | 'female'>('all');

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'appointments':
        navigate('/appointments');
        break;
      case 'new-appointment':
        navigate('/appointments/new');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/home');
        break;
    }
  };

  const filteredPatients = mockPatients.filter((patient: Patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.phone.includes(searchQuery);
    
    const matchesFilter = selectedFilter === 'all' || 
                         patient.gender.toLowerCase() === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handlePatientClick = (patientId: string) => {
    navigate(`/prescriptions/${patientId}`);
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50">
        <TopBar 
          title="Patients"
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="px-6 space-y-6">
          {/* Search and Filter */}
          <Card>
            <div className="space-y-4">
              <InputField
                label="Search Patients"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or phone..."
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                  Filter by Gender
                </label>
                <div className="flex space-x-2">
                  <Button
                    variant={selectedFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('all')}
                    className="flex-1"
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedFilter === 'male' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('male')}
                    className="flex-1"
                  >
                    Male
                  </Button>
                  <Button
                    variant={selectedFilter === 'female' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('female')}
                    className="flex-1"
                  >
                    Female
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Patient List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-700 font-lato">
                Patients ({filteredPatients.length})
              </h3>
              <Button
                size="sm"
                onClick={() => navigate('/patients/new')}
              >
                Add Patient
              </Button>
            </div>

            {filteredPatients.length > 0 ? (
              <div className="space-y-3">
                {filteredPatients.map((patient) => (
                  <Card 
                    key={patient.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800 font-lato">
                          {patient.name}
                        </h4>
                        <p className="text-xs text-gray-600 font-montserrat mt-1">
                          ID: {patient.id} • Age: {patient.age} • {patient.gender}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          {patient.phone}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex flex-col space-y-1">
                          {patient.medicalHistory.diabetic && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              Diabetic
                            </span>
                          )}
                          {patient.medicalHistory.bloodPressure !== 'Normal' && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              BP: {patient.medicalHistory.bloodPressure}
                            </span>
                          )}
                          {patient.medicalHistory.allergies && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                              Allergies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-montserrat text-sm">
                    No patients found matching your search
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Statistics */}
          <Card>
            <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
              Patient Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 font-lato">
                  {mockPatients.length}
                </p>
                <p className="text-xs text-gray-600 font-montserrat">
                  Total Patients
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 font-lato">
                  {mockPatients.filter(p => p.medicalHistory.covidVaccinated).length}
                </p>
                <p className="text-xs text-gray-600 font-montserrat">
                  Vaccinated
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 font-lato">
                  {mockPatients.filter(p => p.medicalHistory.diabetic).length}
                </p>
                <p className="text-xs text-gray-600 font-montserrat">
                  Diabetic
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 font-lato">
                  {mockPatients.filter(p => p.medicalHistory.allergies).length}
                </p>
                <p className="text-xs text-gray-600 font-montserrat">
                  With Allergies
                </p>
              </div>
            </div>
          </Card>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default PatientsPage;
