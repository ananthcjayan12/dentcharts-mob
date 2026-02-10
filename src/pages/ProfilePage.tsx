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

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopBar
          title="Profile"
          onBack={() => navigate('/home')}
          showMenu={false}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Profile Header Background */}
          <div className="bg-white border-b border-gray-200 pb-6 pt-4 px-4 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold mb-3 shadow-inner ring-4 ring-primary-50">
                {profile?.practitioner_name?.charAt(0) || profile?.name?.charAt(0) || 'D'}
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile?.practitioner_name || profile?.name || 'Practitioner'}
              </h1>
              <p className="text-sm text-gray-500 font-medium">Dental Practitioner</p>

              <div className="flex gap-3 mt-4 w-full max-w-xs">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 justify-center"
                  onClick={handleEdit}
                  disabled={isUpdating}
                >
                  Edit Profile
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 justify-center text-red-600 hover:bg-red-50 border-gray-200"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>

            {/* Stats / Pills */}
            <div className="flex justify-center flex-wrap gap-2 mt-4">
              {profile?.years_of_experience && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profile.years_of_experience} Yrs Exp
                </span>
              )}
              {profile?.consultation_fee && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ₹{profile.consultation_fee} Fee
                </span>
              )}
            </div>
          </div>

          <div className="px-4 space-y-4">
            {profileError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-4">
                Unable to load latest profile data.
              </div>
            )}

            {isEditing ? (
              <Card title="Edit Details">
                <div className="space-y-4">
                  <InputField
                    label="Full Name"
                    value={editFormData.practitioner_name || ''}
                    onChange={(e) => updateFormField('practitioner_name', e.target.value)}
                  />
                  <InputField
                    label="Mobile Number"
                    value={editFormData.mobile || ''}
                    onChange={(e) => updateFormField('mobile', e.target.value)}
                  />
                  <InputField
                    label="Email Address"
                    value={editFormData.email || ''}
                    onChange={(e) => updateFormField('email', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Experience (Yrs)"
                      type="number"
                      value={editFormData.years_of_experience?.toString() || ''}
                      onChange={(e) => updateFormField('years_of_experience', parseInt(e.target.value) || 0)}
                    />
                    <InputField
                      label="Fee (₹)"
                      type="number"
                      value={editFormData.consultation_fee?.toString() || ''}
                      onChange={(e) => updateFormField('consultation_fee', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      value={editFormData.start_time || ''}
                      onChange={(e) => updateFormField('start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      value={editFormData.end_time || ''}
                      onChange={(e) => updateFormField('end_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      About
                    </label>
                    <textarea
                      value={editFormData.clinic_description || ''}
                      onChange={(e) => updateFormField('clinic_description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      rows={3}
                      placeholder="Short bio..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
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
                      isLoading={isUpdating}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Contact Info Card */}
                <Card>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-blue-50 rounded text-blue-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Mobile</span>
                      <span className="text-sm font-medium text-gray-900">{profile?.mobile || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Email</span>
                      <span className="text-sm font-medium text-gray-900">{profile?.email || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Working Hours</span>
                      <span className="text-sm font-medium text-gray-900">
                        {profile?.start_time ? profile.start_time.substring(0, 5) : '09:00'} - {profile?.end_time ? profile.end_time.substring(0, 5) : '17:00'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* About Card */}
                {profile?.clinic_description && (
                  <Card>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                      <div className="p-1.5 bg-indigo-50 rounded text-indigo-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">About</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {profile.clinic_description}
                    </p>
                  </Card>
                )}

                {/* Settings Links */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => navigate('/settings/profile')}
                    className="w-full bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">Clinic Settings</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => navigate('/appointments')}
                    className="w-full bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">Manage Appointments</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default ProfilePage;