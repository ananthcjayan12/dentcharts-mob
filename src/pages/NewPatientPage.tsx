import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '../components/layout/MobileContainer';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { useCreatePatient } from '../hooks/usePatients';
import { Patient } from '../types';
import toast from 'react-hot-toast';

const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'new-appointment' | 'profile'>('home');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    sex: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    mobile: '',
    email: '',
    address: '',
    occupation: '',
    // Additional fields for UI (not sent to API)
    diabetic: false,
    bloodPressure: 'Normal' as 'Normal' | 'High' | 'Low' | 'Moderate High',
    cardiacHistory: false,
    allergies: false,
    familyHeartDisease: false,
    covidVaccinated: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // API mutation hook
  const { mutate: createPatient, isPending: isCreating } = useCreatePatient();

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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number format';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Prepare API request data
    const patientData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      sex: formData.sex,
      mobile: formData.mobile.trim(),
      email: formData.email.trim() || undefined,
      dob: formData.dob,
      address: formData.address.trim() || undefined,
      occupation: formData.occupation.trim() || undefined,
    };

    createPatient(patientData, {
      onSuccess: (response) => {
        toast.success(`Patient "${formData.first_name} ${formData.last_name}" created successfully!`);
        navigate('/patients');
      },
      onError: (error) => {
        console.error('Error creating patient:', error);
        toast.error('Failed to create patient. Please try again.');
      }
    });
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50 relative">
        <TopBar 
          title="Add New Patient"
          onBack={() => navigate('/patients')}
          showMenu
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="px-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="First Name *"
                  type="text"
                  data-testid="new-patient-first-name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  error={errors.first_name}
                  required
                />

                <InputField
                  label="Last Name *"
                  type="text"
                  data-testid="new-patient-last-name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  error={errors.last_name}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Date of Birth *"
                  type="date"
                  data-testid="new-patient-dob"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  error={errors.dob}
                  required
                />

                <div>
                  <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                    Sex *
                  </label>
                  <select
                    data-testid="new-patient-sex"
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <InputField
                label="Mobile Number *"
                type="tel"
                data-testid="new-patient-mobile"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="+91XXXXXXXXXX"
                error={errors.mobile}
                required
              />

              <InputField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="patient@example.com"
                error={errors.email}
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                  Address *
                </label>
                <textarea
                  data-testid="new-patient-address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  className={`w-full p-3 border rounded-lg font-montserrat text-sm ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  required
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1 font-montserrat">
                    {errors.address}
                  </p>
                )}
              </div>

              <InputField
                label="Occupation"
                type="text"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Patient's occupation"
              />
            </div>
          </Card>

          {/* Medical History */}
          <Card>
            <h3 className="text-sm font-bold text-gray-700 font-lato mb-4">
              Medical History
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 font-lato mb-2">
                  Blood Pressure
                </label>
                <select
                  value={formData.bloodPressure}
                  onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-montserrat text-sm"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                  <option value="Moderate High">Moderate High</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 font-lato">
                    Diabetic
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.diabetic}
                      onChange={(e) => handleInputChange('diabetic', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 font-lato">
                    Cardiac History
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.cardiacHistory}
                      onChange={(e) => handleInputChange('cardiacHistory', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 font-lato">
                    Known Allergies
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 font-lato">
                    Family Heart Disease
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.familyHeartDisease}
                      onChange={(e) => handleInputChange('familyHeartDisease', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 font-lato">
                    COVID-19 Vaccinated
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.covidVaccinated}
                      onChange={(e) => handleInputChange('covidVaccinated', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4 pb-6">
            <Button
              variant="outline"
              data-testid="new-patient-cancel"
              onClick={() => navigate('/patients')}
              className="flex-1"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              data-testid="new-patient-submit"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Add Patient'}
            </Button>
          </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </MobileContainer>
  );
};

export default NewPatientPage;
