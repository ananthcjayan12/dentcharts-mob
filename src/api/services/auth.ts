import { apiClient, API_ENDPOINTS } from '../client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  PractitionerProfile,
  ApiResponse,
  ClinicPractitionerPermissionsResponse,
} from '../types';
import {
  setStoredUserData,
  clearAllStoredData,
  setActiveClinic,
  setUserClinics,
  getStoredUserData,
  setStoredToken,
  isSessionExpired,
  STORAGE_KEYS,
} from '../../utils/storage';

export class AuthService {
  private defaultAllowedPages = [
    'home',
    'appointments',
    'patients',
    'prescriptions',
    'invoice',
    'financial_dashboard',
    'settings',
  ];

  private defaultNonAdminPages = this.defaultAllowedPages.filter((page) => page !== 'settings');

  private normalizePermissions(raw: any) {
    const admin = Boolean(raw?.permissions?.is_clinic_admin ?? raw?.is_clinic_admin ?? false);
    const pages = Array.isArray(raw?.permissions?.allowed_pages)
      ? raw.permissions.allowed_pages
      : (Array.isArray(raw?.allowed_pages) ? raw.allowed_pages : []);

    const fallback = admin ? this.defaultAllowedPages : this.defaultNonAdminPages;
    const allowed = (pages.length ? pages : fallback)
      .filter((page: any) => typeof page === 'string')
      .filter((page: string) => this.defaultAllowedPages.includes(page));

    return {
      is_clinic_admin: admin,
      allowed_pages: admin
        ? Array.from(new Set([...allowed, 'settings']))
        : allowed.filter((page: string) => page !== 'settings'),
    };
  }

  /**
   * Login user with email and password using Frappe's standard login
   * This endpoint correctly handles stale session cookies
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Clear any stale data before login attempt
    clearAllStoredData();

    // Use Frappe's standard login - it handles session cleanup automatically
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    // Frappe standard login returns { message: "Logged In", full_name: "...", home_page: "..." }
    const loginData = response.data || response;

    // Robust check: Frappe may return the message as a string or nested object
    const loginMessage = typeof loginData === 'string' ? loginData : loginData?.message;
    const isLoggedIn = loginMessage === 'Logged In' || loginMessage === 'No App';

    if (isLoggedIn) {
      // Fetch profile to get full user/clinic data
      try {
        const profileResponse = await apiClient.get<any>(API_ENDPOINTS.AUTH.PROFILE);
        const profile = profileResponse.data || {};
        const permissions = this.normalizePermissions(profile);

        const userData = {
          email: profile.email || credentials.usr,
          full_name: loginData.full_name || profile.name || credentials.usr,
          mobile: profile.phone,
          practitioner_id: profile.id,
          clinic: profile.clinic,
          clinics: profile.clinics || [],
          active_clinic: profile.active_clinic,
          primary_clinic: profile.primary_clinic,
          permissions,
          is_clinic_admin: permissions.is_clinic_admin,
          allowed_pages: permissions.allowed_pages,
        };

        setStoredToken('session');
        setStoredUserData(userData);

        if (userData.clinics?.length > 0) {
          setUserClinics(userData.clinics);
        }
        if (userData.active_clinic) {
          setActiveClinic(userData.active_clinic);
        }

        return {
          message: 'Logged In',
          user: userData,
        };
      } catch (profileError) {
        // If profile fetch fails, still return success with basic info
        const basicUserData = {
          email: credentials.usr,
          full_name: loginData.full_name || credentials.usr,
          mobile: '',
          practitioner_id: '',
          clinics: [],
          permissions: {
            is_clinic_admin: false,
            allowed_pages: this.defaultNonAdminPages,
          },
          is_clinic_admin: false,
          allowed_pages: this.defaultNonAdminPages,
        };
        setStoredToken('session');
        setStoredUserData(basicUserData);
        return {
          message: 'Logged In',
          user: basicUserData,
        };
      }
    }

    throw new Error(loginMessage || 'Login failed');
  }

  /**
   * Register new practitioner
   */
  async register(userData: RegisterRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );

      if (response.message === 'Registration successful') {
        return response;
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage regardless of API response
      clearAllStoredData();
    }
  }

  /**
   * Get current practitioner profile
   */
  async getProfile(): Promise<PractitionerProfile> {
    try {
      const response = await apiClient.get<PractitionerProfile>(
        API_ENDPOINTS.AUTH.PROFILE
      );

      if (response.data) {
        setStoredToken('session');
        // Update stored user data with latest profile
        setStoredUserData(response.data);
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch profile');
    } catch (error) {
      console.error('Get profile error:', error);
      if ((error as any)?.status_code === 401) {
        clearAllStoredData();
      }
      throw error;
    }
  }

  /**
   * Update practitioner profile
   */
  async updateProfile(profileData: Partial<PractitionerProfile>): Promise<PractitionerProfile> {
    try {
      const response = await apiClient.post<PractitionerProfile>(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        profileData
      );

      if (response.data) {
        // Update stored user data
        setStoredUserData(response.data);
        return response.data;
      }

      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    try {
      if (isSessionExpired()) {
        clearAllStoredData();
        return false;
      }
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current user data from storage
   */
  getCurrentUser(): any | null {
    return getStoredUserData();
  }

  /**
   * Switch active clinic for the current session
   */
  async switchClinic(clinic: string): Promise<{ active_clinic: string }> {
    try {
      const response = await apiClient.post<any>(
        '/api/method/mob_clinic.mob_clinic.api.auth.switch_clinic',
        { clinic }
      );

      if (response.data && response.data.active_clinic) {
        // Update stored active clinic
        setActiveClinic(response.data.active_clinic);

        // Update user data with new active clinic
        const userData = this.getCurrentUser();
        if (userData) {
          userData.active_clinic = response.data.active_clinic;
          setStoredUserData(userData);
        }

        return response.data;
      }

      throw new Error('Failed to switch clinic');
    } catch (error) {
      console.error('Switch clinic error:', error);
      throw error;
    }
  }

  async getClinicPractitionerPermissions(clinic?: string): Promise<ClinicPractitionerPermissionsResponse> {
    const endpoint = clinic
      ? `${API_ENDPOINTS.AUTH.CLINIC_PRACTITIONER_PERMISSIONS}?clinic=${encodeURIComponent(clinic)}`
      : API_ENDPOINTS.AUTH.CLINIC_PRACTITIONER_PERMISSIONS;

    const response = await apiClient.get<ClinicPractitionerPermissionsResponse>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch practitioner permissions');
  }

  async updatePractitionerPermissions(payload: {
    clinic: string;
    practitioner_id: string;
    is_clinic_admin: boolean;
    allowed_pages: string[];
  }): Promise<{
    clinic: string;
    practitioner_id: string;
    is_clinic_admin: boolean;
    allowed_pages: string[];
  }> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.UPDATE_PRACTITIONER_PERMISSIONS,
      payload
    );

    if (response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update practitioner permissions');
  }
}

// Create singleton instance
export const authService = new AuthService();
