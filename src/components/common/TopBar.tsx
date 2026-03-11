import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClinicSelector from './ClinicSelector';
import { useAuth } from '../../contexts/AuthContext';
import Portal from './Portal';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  showMenu?: boolean;
  onMenuClick?: () => void;
  variant?: 'default' | 'gradient';
  showClinicSelector?: boolean;
  enableGlobalMenu?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  onBack,
  showMenu: externalShowMenu = false,
  onMenuClick,
  variant = 'default',
  showClinicSelector = false,
  enableGlobalMenu = true
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const hasMultipleClinics = user?.clinics && user.clinics.length > 1;
  const allowedPages = user?.permissions?.allowed_pages || [];
  const isClinicAdmin = Boolean(user?.permissions?.is_clinic_admin);
  const canAccessFinancials = allowedPages.includes('financial_dashboard');
  const canAccessWhatsApp = allowedPages.includes('whatsapp-manager');
  const canAccessSettings = isClinicAdmin && allowedPages.includes('settings');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const baseClasses = "flex items-center justify-between px-4 h-[60px] sticky top-0 z-40 transition-all duration-200";
  const variantClasses = variant === 'gradient'
    ? "bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-lg shadow-primary-900/10"
    : "bg-white/80 backdrop-blur-md border-b border-gray-100/50 text-slate-800 supports-[backdrop-filter]:bg-white/60";

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Determine if we show the menu button
  // Always show if enabledGlobalMenu is true OR externalShowMenu is explicitly true
  const showMenuButton = enableGlobalMenu || externalShowMenu;

  const handleMenuButtonPress = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
  };

  const buttonClass = `p-2.5 rounded-full transition-all duration-200 active:scale-95 ${variant === 'gradient'
    ? 'hover:bg-white/10 text-white'
    : 'hover:bg-slate-100/80 text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      {onBack ? (
        <button
          onClick={onBack}
          className={`${buttonClass} -ml-2`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <div className="w-9" />
      )}

      <h1 className={`text-[17px] font-extrabold font-lato text-center flex-1 truncate px-2 tracking-tight ${variant === 'gradient' ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h1>

      <div className="flex items-center justify-end w-auto min-w-[36px]">
        {showClinicSelector && hasMultipleClinics && (
          <div className="mr-1">
            <ClinicSelector variant="modal" />
          </div>
        )}

        {showMenuButton ? (
          <button
            ref={buttonRef}
            onClick={handleMenuButtonPress}
            className={`${buttonClass} -mr-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Global Menu Dropdown */}
      {isMenuOpen && !onMenuClick && (
        <Portal>
          <div
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed right-4 top-16 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5 py-1 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
          >
            {canAccessFinancials && (
              <div onClick={() => { navigate('/financial-dashboard'); setIsMenuOpen(false); }} className="px-4 py-3 hover:bg-gray-50/50 cursor-pointer flex items-center gap-3 border-b border-gray-100/50 transition-colors">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Financials</p>
                  <p className="text-[10px] font-medium text-gray-500">View dashboard & stats</p>
                </div>
              </div>
            )}
            {canAccessWhatsApp && (
              <div onClick={() => { navigate('/whatsapp-manager'); setIsMenuOpen(false); }} className="px-4 py-3 hover:bg-gray-50/50 cursor-pointer flex items-center gap-3 border-b border-gray-100/50 transition-colors">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">WhatsApp Manager</p>
                  <p className="text-[10px] font-medium text-gray-500">Settings, logs, conversations</p>
                </div>
              </div>
            )}
            {canAccessSettings && (
              <>
                <div onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} className="px-4 py-3 hover:bg-gray-50/50 cursor-pointer flex items-center gap-3 transition-colors">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Settings</p>
                    <p className="text-[10px] font-medium text-gray-500">App preferences</p>
                  </div>
                </div>
              </>
            )}
            <div onClick={() => { void handleLogout(); }} className="px-4 py-3 hover:bg-red-50/50 cursor-pointer flex items-center gap-3 border-t border-gray-100/50 transition-colors">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h10a2 2 0 002-2v-2m0-10V5a2 2 0 00-2-2H3" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Logout</p>
                <p className="text-[10px] font-medium text-gray-500">Sign out of this session</p>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default TopBar;
