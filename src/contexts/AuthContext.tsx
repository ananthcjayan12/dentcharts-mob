import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { useAuthActions } from '../hooks/useAuth';
import { getStoredUserData } from '../utils/storage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const initializeAuth = () => {
      try {
        const storedUser = getStoredUserData();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiLogin({ usr: email, pwd: password });
      
      // Convert API response to User format
      const userData: User = {
        id: response.user.practitioner_id || response.user.email,
        name: response.user.full_name,
        email: response.user.email,
        phone: response.user.mobile,
        role: 'doctor',
        practitioner_id: response.user.practitioner_id,
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
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout error in context:', error);
      // Still clear local state even if API call fails
      setUser(null);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading: !isInitialized || apiLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
