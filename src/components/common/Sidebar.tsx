import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ClinicSelector from './ClinicSelector';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const allowedPages = user?.permissions?.allowed_pages || [];
  const isClinicAdmin = Boolean(user?.permissions?.is_clinic_admin);

  const menuItems = [
    {
      id: 'dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/home',
      label: 'Dashboard',
      pageKey: 'home'
    },
    {
      id: 'appointments',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/appointments',
      label: 'Appointments',
      pageKey: 'appointments'
    },
    {
      id: 'financials',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/financial-dashboard',
      label: 'Financials',
      pageKey: 'financial_dashboard'
    },
    {
      id: 'patients',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/patients',
      label: 'Patients',
      pageKey: 'patients'
    },
    {
      id: 'consent-forms',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/consent-forms',
      label: 'Consent',
      pageKey: 'consent_forms'
    },
    {
      id: 'invoices',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
      path: '/invoices',
      label: 'Invoices',
      pageKey: 'invoice'
    },
    {
      id: 'whatsapp-manager',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
        </svg>
      ),
      path: '/whatsapp-manager',
      label: 'WhatsApp',
      pageKey: 'whatsapp-manager'
    },
    {
      id: 'settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/settings',
      label: 'Settings',
      pageKey: 'settings'
    }
  ];

  const visibleMenuItems = menuItems.filter((item: any) => {
    if (!item.pageKey) {
      return true;
    }
    if (item.pageKey === 'settings' && !isClinicAdmin) {
      return false;
    }
    return allowedPages.includes(item.pageKey);
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`hidden lg:flex lg:flex-col lg:w-20 bg-white border-r border-gray-200 fixed left-0 top-0 h-screen shadow-sm ${className}`} style={{ zIndex: 1000 }}>
      {/* Logo/Brand Section */}
      <div className="flex flex-col items-center border-b border-gray-200">
        <div className="flex items-center justify-center h-20">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
        </div>
        {/* Clinic Selector in expanded state on hover */}
        <div className="absolute left-20 top-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          <ClinicSelector className="ml-2" />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center py-6 space-y-1">
        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`
              relative group flex items-center justify-center w-14 h-14 rounded-xl
              transition-all duration-200 ease-in-out
              ${isActive(item.path)
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }
            `}
            title={item.label}
          >
            {item.icon}

            {/* Active Indicator */}
            {isActive(item.path) && (
              <div className="absolute -left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
            )}

            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-xl pointer-events-none z-50">
              {item.label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          </button>
        ))}
      </nav>

      {/* User Profile Section at Bottom */}
      <div className="flex flex-col items-center py-4 border-t border-gray-200 space-y-3">
        <button
          onClick={() => navigate('/profile')}
          className={`
            relative group flex items-center justify-center w-14 h-14 rounded-xl
            transition-all duration-200 ease-in-out
            ${isActive('/profile')
              ? 'bg-primary-50 text-primary-600'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
            }
          `}
          title="Profile"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-xl pointer-events-none z-50">
            Profile
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
