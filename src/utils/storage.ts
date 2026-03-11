// Storage utility functions for handling authentication tokens and user data

const STORAGE_PREFIX = process.env.REACT_APP_STORAGE_PREFIX || 'dentcharts_';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: `${STORAGE_PREFIX}auth_token`,
  USER_DATA: `${STORAGE_PREFIX}user_data`,
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
  SESSION_EXPIRY: `${STORAGE_PREFIX}session_expiry`,
  ACTIVE_CLINIC: `${STORAGE_PREFIX}active_clinic`,
  USER_CLINICS: `${STORAGE_PREFIX}user_clinics`,
} as const;

// Token management
export const getStoredToken = (): string | null => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);

    if (token && expiry) {
      const expiryTime = new Date(expiry);
      if (new Date() > expiryTime) {
        // Token expired, clear ALL stored data to ensure clean state for re-login
        // Inline the cleanup to avoid circular dependency
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CLINIC);
        localStorage.removeItem(STORAGE_KEYS.USER_CLINICS);
        return null;
      }
      return token;
    }

    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const setStoredToken = (token: string, expiryHours: number = 24): void => {
  try {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + expiryHours);

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiryTime.toISOString());
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const clearStoredToken = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
  } catch (error) {
    console.error('Error clearing stored token:', error);
  }
};

// User data management
export const getStoredUserData = (): any | null => {
  try {
    if (isSessionExpired()) {
      clearAllStoredData();
      return null;
    }

    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting stored user data:', error);
    return null;
  }
};

export const setStoredUserData = (userData: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

export const clearStoredUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error clearing stored user data:', error);
  }
};

// Clear all stored data
export const clearAllStoredData = (): void => {
  clearStoredToken();
  clearStoredUserData();
  clearClinicData();
  clearSessionCookies();
};

// Clear session cookies (for Frappe session management)
export const clearSessionCookies = (): void => {
  try {
    // Get all cookies and clear them
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const cookieName = cookie.split('=')[0].trim();
      // Clear the cookie by setting expiry to past date
      // Also try with different paths and domains
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
    }

    console.log('Session cookies cleared');
  } catch (error) {
    console.error('Error clearing session cookies:', error);
  }
};

// Check if user is authenticated (has valid token)
export const isAuthenticated = (): boolean => {
  return getStoredToken() !== null;
};

// Session management
export const getSessionExpiry = (): Date | null => {
  try {
    const expiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
    return expiry ? new Date(expiry) : null;
  } catch (error) {
    console.error('Error getting session expiry:', error);
    return null;
  }
};

export const isSessionExpired = (): boolean => {
  const expiry = getSessionExpiry();
  return expiry ? new Date() > expiry : true;
};

// Refresh token management
export const getStoredRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting stored refresh token:', error);
    return null;
  }
};

export const setStoredRefreshToken = (refreshToken: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } catch (error) {
    console.error('Error storing refresh token:', error);
  }
};

// Clinic management
export const getActiveClinic = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CLINIC);
  } catch (error) {
    console.error('Error getting active clinic:', error);
    return null;
  }
};

export const setActiveClinic = (clinic: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLINIC, clinic);
  } catch (error) {
    console.error('Error setting active clinic:', error);
  }
};

export const getUserClinics = (): string[] => {
  try {
    const clinics = localStorage.getItem(STORAGE_KEYS.USER_CLINICS);
    return clinics ? JSON.parse(clinics) : [];
  } catch (error) {
    console.error('Error getting user clinics:', error);
    return [];
  }
};

export const setUserClinics = (clinics: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_CLINICS, JSON.stringify(clinics));
  } catch (error) {
    console.error('Error setting user clinics:', error);
  }
};

export const clearClinicData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CLINIC);
    localStorage.removeItem(STORAGE_KEYS.USER_CLINICS);
  } catch (error) {
    console.error('Error clearing clinic data:', error);
  }
};
