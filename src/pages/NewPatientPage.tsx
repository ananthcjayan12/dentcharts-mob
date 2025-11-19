import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import { useCreatePatient } from '../hooks/usePatients';
import { Patient } from '../types';
import toast from 'react-hot-toast';

const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    sex: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    age: '',
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
    covidVaccinated: false,
    otherMedicalHistory: ''
  });

  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState('');
  const [addToQueue, setAddToQueue] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // API mutation hook
  const { mutate: createPatient, isPending: isCreating } = useCreatePatient();

  const handleTabChange = (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => {
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
      dob: formData.dob || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      address: formData.address.trim() || undefined,
      occupation: formData.occupation.trim() || undefined,
      medical_history: JSON.stringify({
        diabetic: formData.diabetic,
        blood_pressure: formData.bloodPressure,
        cardiac_history: formData.cardiacHistory,
        allergies: formData.allergies,
        family_heart_disease: formData.familyHeartDisease,
        covid_vaccinated: formData.covidVaccinated,
        other: formData.otherMedicalHistory.trim() || null
      })
    };

    createPatient(patientData, {
      onSuccess: (response) => {
        toast.success(`Patient "${formData.first_name} ${formData.last_name}" created successfully!`);
        
        // If date is selected or add to queue is checked, navigate to appointments
        if (selectedAppointmentDate || addToQueue) {
          const patientId = response.patient_id;
          if (addToQueue) {
            navigate(`/appointments/new?patientId=${patientId}&date=${new Date().toISOString().split('T')[0]}`);
          } else if (selectedAppointmentDate) {
            navigate(`/appointments/new?patientId=${patientId}&date=${selectedAppointmentDate}`);
          }
        } else {
          navigate('/patients');
        }
      },
      onError: (error) => {
        console.error('Error creating patient:', error);
        toast.error('Failed to create patient. Please try again.');
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-lato">
            New Patient Registration
          </h2>
          <button
            onClick={() => navigate('/patients')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-5">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Basic Information</h3>
              
              <div className="space-y-3">
                {/* Row 1: First Name and Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Gender and Age */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Age"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Row 3: Mobile and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        errors.mobile ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.mobile && (
                      <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="patient@example.com"
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Row 4: Address and Occupation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Address *</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter complete address"
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      rows={2}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      placeholder="Patient's occupation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Medical History</h3>
              
              <div className="space-y-3">
                {/* Blood Pressure */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Blood Pressure</label>
                    <select
                      value={formData.bloodPressure}
                      onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Low">Low</option>
                      <option value="Moderate High">Moderate High</option>
                    </select>
                  </div>
                </div>

                {/* Medical Conditions Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Diabetic</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.diabetic}
                        onChange={(e) => handleInputChange('diabetic', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Cardiac History</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.cardiacHistory}
                        onChange={(e) => handleInputChange('cardiacHistory', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Known Allergies</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Family Heart Disease</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.familyHeartDisease}
                        onChange={(e) => handleInputChange('familyHeartDisease', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded col-span-1 sm:col-span-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">COVID-19 Vaccinated</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.covidVaccinated}
                        onChange={(e) => handleInputChange('covidVaccinated', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Other Medical History */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Other Medical History / Chief Complaint</label>
                  <textarea
                    value={formData.otherMedicalHistory}
                    onChange={(e) => handleInputChange('otherMedicalHistory', e.target.value)}
                    placeholder="Any other medical conditions or chief complaint..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Date Selection Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <input
                  type="date"
                  value={selectedAppointmentDate}
                  onChange={(e) => {
                    setSelectedAppointmentDate(e.target.value);
                    setAddToQueue(false);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Select appointment date"
                />
              </div>

              <button 
                type="button"
                onClick={() => {
                  setAddToQueue(!addToQueue);
                  if (!addToQueue) {
                    setSelectedAppointmentDate('');
                  }
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-sm transition-colors ${
                  addToQueue
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {addToQueue ? 'Added to Queue' : 'Add to Todays Queue'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={() => navigate('/patients')}
            disabled={isCreating}
            className="px-4 sm:px-6 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="px-4 sm:px-6 bg-primary-600 hover:bg-primary-700 text-sm"
          >
            {isCreating ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewPatientPage;
