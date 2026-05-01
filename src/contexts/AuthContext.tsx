import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType, PagePermissionKey } from '../types';
import { useAuthActions } from '../hooks/useAuth';
import { clearAllStoredData, getStoredUserData } from '../utils/storage';
import { authService } from '../api/services/auth';
import toast from 'react-hot-toast';

const DEFAULT_ALLOWED_PAGES: PagePermissionKey[] = [
  'home',
  'appointments',
  'patients',
  'prescriptions',
  'consent_forms',
  'invoice',
  'financial_dashboard',
  'whatsapp-manager',
  'settings',
];

const DEFAULT_NON_ADMIN_PAGES: PagePermissionKey[] = DEFAULT_ALLOWED_PAGES.filter((page) => page !== 'settings');

const normalizePermissions = (permissions?: any, isClinicAdmin?: boolean, allowedPages?: any): User['permissions'] => {
  const admin = Boolean(
    permissions?.is_clinic_admin ??
    isClinicAdmin ??
    false
  );

  const pages = Array.isArray(permissions?.allowed_pages)
    ? permissions.allowed_pages
    : (Array.isArray(allowedPages) ? allowedPages : []);

  const fallback = admin ? DEFAULT_ALLOWED_PAGES : DEFAULT_NON_ADMIN_PAGES;
  const normalizedPages = (pages.length ? pages : fallback)
    .filter((page: any) => typeof page === 'string')
    .filter((page: string) => DEFAULT_ALLOWED_PAGES.includes(page as PagePermissionKey)) as PagePermissionKey[];

  const finalPages = admin
    ? Array.from(new Set([...normalizedPages, 'settings'])) as PagePermissionKey[]
    : normalizedPages.filter((page) => page !== 'settings');

  return {
    is_clinic_admin: admin,
    allowed_pages: finalPages.length ? finalPages : fallback,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapProfileToUser = (profile: any): User => {
  const permissions = normalizePermissions(
    profile.permissions,
    profile.is_clinic_admin,
    profile.allowed_pages
  );

  return {
    id: profile.id || profile.practitioner_id || profile.email,
    name: profile.name || profile.full_name || profile.email,
    email: profile.email,
    phone: profile.phone || profile.mobile,
    role: 'doctor',
    practitioner_id: profile.id || profile.practitioner_id,
    clinic: profile.clinic,
    clinics: profile.clinics || [],
    active_clinic: profile.active_clinic,
    primary_clinic: profile.primary_clinic,
    permissions,
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    login: apiLogin,
    register: apiRegister,
    logout: apiLogout,
    isLoading: apiLoading,
  } = useAuthActions();

  // Initialize user from stored data on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getStoredUserData();
        if (!storedUser) {
          setUser(null);
          return;
        }

        try {
          const latestProfile = await authService.getProfile();
          setUser(mapProfileToUser(latestProfile));
        } catch (error: any) {
          if (error?.status_code === 401) {
            clearAllStoredData();
            setUser(null);
            if (window.location.pathname !== '/login') {
              window.location.replace('/login');
              return;
            }
          } else {
            setUser(mapProfileToUser(storedUser));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAllStoredData();
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    void initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiLogin({ usr: email, pwd: password });
      const permissions = normalizePermissions(
        response.user.permissions,
        response.user.is_clinic_admin,
        response.user.allowed_pages
      );
      // Convert API response to User format
      const userData: User = {
        id: response.user.practitioner_id || response.user.email,
        name: response.user.full_name,
        email: response.user.email,
        phone: response.user.mobile,
        role: 'doctor',
        practitioner_id: response.user.practitioner_id,
        clinic: response.user.clinic,
        clinics: response.user.clinics || [],
        active_clinic: response.user.active_clinic,
        primary_clinic: response.user.primary_clinic,
        permissions,
      };

      setUser(userData);
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    try {
      await apiRegister({
        full_name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        password: userData.password,
        clinic_name: userData.name || 'My Clinic',
      });
    } catch (error) {
      console.error('Register error in context:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Clear local auth state first so protected routes react immediately.
    setUser(null);
    clearAllStoredData();

    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }

    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error in context:', error);
    }
  };

  const switchClinic = async (clinic: string) => {
    try {
      const response = await authService.switchClinic(clinic);

      if (response.active_clinic && user) {
        // Update user with new active clinic
        const updatedUser = {
          ...user,
          active_clinic: response.active_clinic,
        };
        setUser(updatedUser);
        toast.success(`Switched to ${clinic}`);
      }
    } catch (error: any) {
      console.error('Switch clinic error in context:', error);
      toast.error(error?.message || 'Failed to switch clinic');
      throw error;
    }
  };

  const canAccessPage = (pageKey: PagePermissionKey) => {
    if (!user?.permissions) {
      return false;
    }

    if (pageKey === 'settings' && !user.permissions.is_clinic_admin) {
      return false;
    }

    return user.permissions.allowed_pages.includes(pageKey);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    switchClinic,
    canAccessPage,
    isLoading: !isInitialized || apiLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
