import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { useProfile, useUpdateProfile, useLogout } from '../hooks/useAuth';
import { PractitionerProfile } from '../api/types';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  
  // API hooks
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: logout } = useLogout();
  
  // Local state for editing
  const [editFormData, setEditFormData] = useState<Partial<PractitionerProfile>>({});

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
        navigate('/appointments/new', { state: { backgroundLocation: location } });
        break;
      default:
        break;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Initialize edit form with current profile data
    if (profile) {
      setEditFormData({ ...profile });
    }
  };

  const handleSave = () => {
    if (Object.keys(editFormData).length > 0) {
      updateProfile(editFormData, {
        onSuccess: () => {
          setIsEditing(false);
          setEditFormData({});
        }
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const updateFormField = (field: keyof PractitionerProfile, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            {profileLoading ? (
              <div className="text-center animate-pulse">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ) : profileError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error loading profile</p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : profile ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-lg border-4 border-white bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {profile.practitioner_name?.charAt(0) || profile.name?.charAt(0) || 'D'}
                  </span>
                </div>
                
                <h1 className="text-lg font-bold text-primary-600 font-lato mb-2">
                  {profile.practitioner_name || profile.name}
                </h1>
                
                <div className="text-sm text-black font-lato mb-2">
                  <p className="font-semibold">Dental Practitioner</p>
                  {profile.years_of_experience && (
                    <p className="text-gray-600">{profile.years_of_experience} years Experience</p>
                  )}
                  {profile.consultation_fee && (
                    <p className="text-green-600">₹{profile.consultation_fee} Consultation Fee</p>
                  )}
                </div>

                <div className="flex justify-center space-x-4">
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={handleEdit}
                    disabled={isUpdating}
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
            ) : null}

            {/* Personal Info */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-700 font-lato">
                  Personal Information
                </h3>
                <button 
                  onClick={handleEdit}
                  className="text-blue-500 hover:text-blue-700"
                  disabled={isUpdating}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <InputField
                    label="Practitioner Name"
                    value={editFormData.practitioner_name || ''}
                    onChange={(e) => updateFormField('practitioner_name', e.target.value)}
                  />
                  <InputField
                    label="Mobile"
                    value={editFormData.mobile || ''}
                    onChange={(e) => updateFormField('mobile', e.target.value)}
                  />
                  <InputField
                    label="Email"
                    value={editFormData.email || ''}
                    onChange={(e) => updateFormField('email', e.target.value)}
                  />
                  <InputField
                    label="Years of Experience"
                    type="number"
                    value={editFormData.years_of_experience?.toString() || ''}
                    onChange={(e) => updateFormField('years_of_experience', parseInt(e.target.value) || 0)}
                  />
                  <InputField
                    label="Consultation Fee"
                    type="number"
                    value={editFormData.consultation_fee?.toString() || ''}
                    onChange={(e) => updateFormField('consultation_fee', parseFloat(e.target.value) || 0)}
                  />
                  <div>
                    <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                      Clinic Description
                    </label>
                    <textarea
                      value={editFormData.clinic_description || ''}
                      onChange={(e) => updateFormField('clinic_description', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
                      rows={3}
                      placeholder="Describe your clinic and services..."
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700 font-lato">Name:</span>
                    <span className="text-sm text-gray-600 font-lato">{profile?.practitioner_name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700 font-lato">Mobile:</span>
                    <span className="text-sm text-gray-600 font-lato">{profile?.mobile || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700 font-lato">Email:</span>
                    <span className="text-sm text-gray-600 font-lato text-right">{profile?.email || 'Not set'}</span>
                  </div>
                  {profile?.years_of_experience && (
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-gray-700 font-lato">Experience:</span>
                      <span className="text-sm text-gray-600 font-lato">{profile.years_of_experience} years</span>
                    </div>
                  )}
                  {profile?.consultation_fee && (
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-gray-700 font-lato">Consultation Fee:</span>
                      <span className="text-sm text-gray-600 font-lato">₹{profile.consultation_fee}</span>
                    </div>
                  )}
                  {profile?.clinic_description && (
                    <div>
                      <span className="text-sm font-bold text-gray-700 font-lato">Clinic Description:</span>
                      <p className="text-sm text-gray-600 font-lato mt-1">{profile.clinic_description}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-base font-bold text-gray-700 font-lato mb-4">
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Appointments</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/patients')}
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-xs">Patients</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/invoice')}
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs">Invoice</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex flex-col items-center py-4 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-xs">Logout</span>
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