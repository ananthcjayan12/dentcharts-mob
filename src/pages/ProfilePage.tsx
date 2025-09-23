import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

// Mock patient data
const mockPatient = {
  id: 'P0001',
  name: 'Sample Patient Name',
  phone: '+919400475408',
  age: 33,
  gender: 'Male' as const,
  dateOfBirth: '29 Aug 1989',
  email: 'drkamal@gmail.com',
  address: '21, Block -C, Road 132. Gulshan, Dhaka - 1211',
  medicalHistory: {
    diabetic: true,
    bloodPressure: 'Moderate High' as const,
    cardiacHistory: false,
    allergies: false,
    familyHeartDisease: false,
    covidVaccinated: true,
    occupation: 'Software Developer'
  },
  avatar: '/api/placeholder/100/100'
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('profile');

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/home');
        break;
      case 'appointments':
        // Navigate to appointments page
        break;
      case 'new-appointment':
        // Navigate to new appointment page
        break;
      default:
        break;
    }
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-b from-primary-300 to-green-200 pb-20">
        <div className="w-16 h-1.5 bg-primary-500 mx-auto pt-6 rounded-full"></div>
        
        <TopBar 
          title="My Profile" 
          onBack={() => navigate('/home')}
          showMenu
        />

        <div className="px-6 space-y-6">
          {/* Profile Header */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-lg">
              <img 
                src={mockPatient.avatar} 
                alt={mockPatient.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <h1 className="text-lg font-bold text-primary-600 font-lato mb-2">
              {mockPatient.name}
            </h1>
            
            <div className="text-sm text-black font-lato mb-4">
              <p>ID : {mockPatient.id}</p>
              <p>{mockPatient.phone}</p>
            </div>

            <div className="flex justify-center space-x-4">
              <Button size="sm" variant="primary">
                Edit Patient
              </Button>
              <Button size="sm" variant="secondary">
                View History
              </Button>
            </div>
          </div>

          {/* Personal Info */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 font-lato">
                Personal Info
              </h2>
              <span className="text-lg">✏️</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-sm text-primary-500 font-lato font-semibold">Age</span>
                <span className="text-sm text-gray-600 font-lato">{mockPatient.age}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-sm text-primary-500 font-lato font-semibold">Gender</span>
                <span className="text-sm text-gray-600 font-lato">{mockPatient.gender}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-primary-500 font-lato font-semibold">Date of Birth</span>
                <span className="text-sm text-gray-600 font-lato">{mockPatient.dateOfBirth}</span>
              </div>
            </div>
          </Card>

          {/* Account Info */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 font-lato">
                Account Info
              </h2>
              <span className="text-lg">✏️</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-sm text-primary-500 font-lato font-semibold">Email</span>
                <span className="text-sm text-gray-600 font-lato text-right">{mockPatient.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-sm text-primary-500 font-lato font-semibold">Phone</span>
                <span className="text-sm text-gray-600 font-lato">{mockPatient.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-primary-500 font-lato font-semibold">Address</span>
                <span className="text-sm text-gray-600 font-lato text-right max-w-48">
                  {mockPatient.address}
                </span>
              </div>
            </div>
          </Card>

          {/* Health Info and Medical History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 font-lato">
                Health Info and Medical History
              </h2>
              <span className="text-lg">✏️</span>
            </div>
            
            <Card>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-primary-500 font-lato font-semibold">Have Diabatis</span>
                  <span className="text-sm text-gray-600 font-lato">{mockPatient.medicalHistory.diabetic ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-primary-500 font-lato font-semibold">High /Low Blood Pressure</span>
                  <span className="text-sm text-gray-600 font-lato">{mockPatient.medicalHistory.bloodPressure}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-primary-500 font-lato font-semibold">Cardiac Attack History</span>
                  <span className="text-sm text-gray-600 font-lato">{mockPatient.medicalHistory.cardiacHistory ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-primary-500 font-lato font-semibold">Allergies</span>
                  <span className="text-sm text-gray-600 font-lato">{mockPatient.medicalHistory.allergies ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-primary-500 font-lato font-semibold">Family Heart Disease History</span>
                  <span className="text-sm text-gray-600 font-lato">{mockPatient.medicalHistory.familyHeartDisease ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-primary-500 font-lato font-semibold">COVID Vaccinated</span>
                  <span className="text-sm text-gray-600 font-lato">{mockPatient.medicalHistory.covidVaccinated ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-primary-500 font-lato font-semibold">Occupation</span>
                  <span className="text-sm text-gray-600 font-lato">{mockPatient.medicalHistory.occupation}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default ProfilePage;
