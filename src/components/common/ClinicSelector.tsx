import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ClinicSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'modal';
}

const ClinicSelector: React.FC<ClinicSelectorProps> = ({ 
  className = '', 
  variant = 'dropdown' 
}) => {
  const { user, switchClinic } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!user || !user.clinics || user.clinics.length <= 1) {
    // Don't show selector if user has only one clinic or no clinics
    return null;
  }

  const handleClinicChange = async (clinic: string) => {
    if (clinic === user.active_clinic) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchClinic(clinic);
      setIsOpen(false);
      // Refresh the page to reload data for new clinic
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch clinic:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-300 hover:border-primary-500 transition-colors"
          disabled={isSwitching}
        >
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {user.active_clinic || 'Select Clinic'}
          </span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Switch Clinic
                </div>
                {user.clinics.map((clinic) => (
                  <button
                    key={clinic}
                    onClick={() => handleClinicChange(clinic)}
                    disabled={isSwitching}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      clinic === user.active_clinic
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{clinic}</span>
                      {clinic === user.active_clinic && (
                        <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Modal variant (for mobile)
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 ${className}`}
        disabled={isSwitching}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium">
          {user.active_clinic || 'Select Clinic'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Select Clinic</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {user.clinics.map((clinic) => (
                <button
                  key={clinic}
                  onClick={() => handleClinicChange(clinic)}
                  disabled={isSwitching}
                  className={`w-full text-left p-4 border-b border-gray-100 transition-colors ${
                    clinic === user.active_clinic
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50'
                  } ${isSwitching ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${
                        clinic === user.active_clinic ? 'text-primary-700' : 'text-gray-800'
                      }`}>
                        {clinic}
                      </div>
                      {clinic === user.active_clinic && (
                        <div className="text-xs text-primary-600 mt-1">Currently Active</div>
                      )}
                    </div>
                    {clinic === user.active_clinic && (
                      <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClinicSelector;
