import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';

// Mock doctor/clinic data
const mockDoctorProfile = {
  id: 'DOC001',
  name: 'Dr. Kamal Rahman',
  phone: '+919400475408',
  email: 'drkamal@dentalcare.com',
  specialization: 'Dental Surgeon',
  experience: '8 years',
  qualification: 'BDS, MDS',
  registrationNumber: 'MCI-12345',
  clinic: {
    name: 'DentCare Clinic',
    address: '21, Block -C, Road 132, Gulshan, Dhaka - 1211',
    phone: '+8801234567890',
    email: 'info@dentcare.com',
    website: 'www.dentcare.com',
    timings: '9:00 AM - 6:00 PM',
    workingDays: 'Monday - Saturday'
  },
  services: [
    'General Dentistry',
    'Root Canal Treatment',
    'Dental Implants',
    'Teeth Whitening',
    'Orthodontics'
  ],
  avatar: '/api/placeholder/100/100'
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [profileData, setProfileData] = useState(mockDoctorProfile);

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigate('/home');
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

  const handleEdit = (section: string) => {
    setEditingSection(section);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    setEditingSection(null);
    // Here you would typically save to backend
    console.log('Profile updated:', profileData);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSection(null);
    // Reset to original data
    setProfileData(mockDoctorProfile);
  };

  const updateProfile = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-b from-primary-300 to-green-200 relative">
        <div className="w-16 h-1.5 bg-primary-500 mx-auto pt-6 rounded-full"></div>
        
        <TopBar 
          title="Doctor Profile" 
          onBack={() => navigate('/home')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="px-6 space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-lg border-4 border-white">
                <img 
                  src={profileData.avatar} 
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h1 className="text-lg font-bold text-primary-600 font-lato mb-2">
                {profileData.name}
              </h1>
              
              <div className="text-sm text-black font-lato mb-2">
                <p className="font-semibold">{profileData.specialization}</p>
                <p>{profileData.qualification}</p>
                <p className="text-gray-600">{profileData.experience} Experience</p>
              </div>

              <div className="flex justify-center space-x-4">
                <Button 
                  size="sm" 
                  variant="primary"
                  onClick={() => handleEdit('personal')}
                >
                  Edit Profile
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => navigate('/appointments')}
                >
                  View Schedule
                </Button>
              </div>
            </div>

            {/* Personal Info */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700 font-lato">
                  Personal Information
                </h2>
                <button
                  onClick={() => handleEdit('personal')}
                  className="text-primary-500 hover:text-primary-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              {editingSection === 'personal' ? (
                <div className="space-y-3">
                  <InputField
                    label="Full Name"
                    value={profileData.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                  />
                  <InputField
                    label="Specialization"
                    value={profileData.specialization}
                    onChange={(e) => updateProfile('specialization', e.target.value)}
                  />
                  <InputField
                    label="Qualification"
                    value={profileData.qualification}
                    onChange={(e) => updateProfile('qualification', e.target.value)}
                  />
                  <InputField
                    label="Experience"
                    value={profileData.experience}
                    onChange={(e) => updateProfile('experience', e.target.value)}
                  />
                  <InputField
                    label="Registration Number"
                    value={profileData.registrationNumber}
                    onChange={(e) => updateProfile('registrationNumber', e.target.value)}
                  />
                  <InputField
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                  />
                  <InputField
                    label="Email"
                    value={profileData.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                  />
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} className="flex-1">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Qualification</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.qualification}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Experience</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.experience}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Registration No.</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Phone</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.phone}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Email</span>
                    <span className="text-sm text-gray-600 font-lato text-right">{profileData.email}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Clinic Information */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700 font-lato">
                  Clinic Information
                </h2>
                <button
                  onClick={() => handleEdit('clinic')}
                  className="text-primary-500 hover:text-primary-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              {editingSection === 'clinic' ? (
                <div className="space-y-3">
                  <InputField
                    label="Clinic Name"
                    value={profileData.clinic.name}
                    onChange={(e) => updateProfile('clinic.name', e.target.value)}
                  />
                  <InputField
                    label="Address"
                    value={profileData.clinic.address}
                    onChange={(e) => updateProfile('clinic.address', e.target.value)}
                  />
                  <InputField
                    label="Clinic Phone"
                    value={profileData.clinic.phone}
                    onChange={(e) => updateProfile('clinic.phone', e.target.value)}
                  />
                  <InputField
                    label="Clinic Email"
                    value={profileData.clinic.email}
                    onChange={(e) => updateProfile('clinic.email', e.target.value)}
                  />
                  <InputField
                    label="Website"
                    value={profileData.clinic.website}
                    onChange={(e) => updateProfile('clinic.website', e.target.value)}
                  />
                  <InputField
                    label="Working Hours"
                    value={profileData.clinic.timings}
                    onChange={(e) => updateProfile('clinic.timings', e.target.value)}
                  />
                  <InputField
                    label="Working Days"
                    value={profileData.clinic.workingDays}
                    onChange={(e) => updateProfile('clinic.workingDays', e.target.value)}
                  />
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} className="flex-1">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Clinic Name</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.clinic.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Address</span>
                    <span className="text-sm text-gray-600 font-lato text-right max-w-48">
                      {profileData.clinic.address}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Clinic Phone</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.clinic.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Email</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.clinic.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Website</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.clinic.website}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Working Hours</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.clinic.timings}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-primary-500 font-lato font-semibold">Working Days</span>
                    <span className="text-sm text-gray-600 font-lato">{profileData.clinic.workingDays}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Services Offered */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700 font-lato">
                  Services Offered
                </h2>
                <button
                  onClick={() => handleEdit('services')}
                  className="text-primary-500 hover:text-primary-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              {editingSection === 'services' ? (
                <div className="space-y-3">
                  {profileData.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={service}
                        onChange={(e) => {
                          const newServices = [...profileData.services];
                          newServices[index] = e.target.value;
                          updateProfile('services', newServices);
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          const newServices = profileData.services.filter((_, i) => i !== index);
                          updateProfile('services', newServices);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newServices = [...profileData.services, ''];
                      updateProfile('services', newServices);
                    }}
                    className="w-full"
                  >
                    Add Service
                  </Button>
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} className="flex-1">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {profileData.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2 py-1">
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                      <span className="text-sm text-gray-600 font-lato">{service}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <h2 className="text-sm font-bold text-gray-700 font-lato mb-4">
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">View Schedule</span>
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/patients')}
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xs">Patient List</span>
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/invoice')}
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs">Create Invoice</span>
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/home')}
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15v-2a2 2 0 112 2v2a2 2 0 11-4 0z" />
                  </svg>
                  <span className="text-xs">Dashboard</span>
                </Button>
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

export default ProfilePage;
