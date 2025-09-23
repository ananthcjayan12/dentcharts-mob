import React from 'react';

interface BottomNavProps {
  activeTab: 'home' | 'appointments' | 'new-appointment' | 'profile';
  onTabChange: (tab: 'home' | 'appointments' | 'new-appointment' | 'profile') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'appointments', label: 'My Appointments', icon: '📅' },
    { id: 'new-appointment', label: 'New Appointment', icon: '➕' },
    { id: 'profile', label: 'My Profile', icon: '👤' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 shadow-lg">
      <div className="flex justify-between items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`flex flex-col items-center p-2 ${
              activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs font-montserrat font-semibold">
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
