import { apiClient, API_ENDPOINTS } from '../client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  PractitionerProfile,
  ApiResponse,
} from '../types';
import { setStoredToken, setStoredUserData, clearAllStoredData } from '../../utils/storage';

export class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.data && response.message === 'Logged In') {
        // Store session data - Frappe typically uses session cookies
        // but we might also get user data to store
        if (response.data.user) {
          setStoredUserData(response.data.user);
        }
        
        return response.data;
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
        // Update stored user data with latest profile
        setStoredUserData(response.data);
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch profile');
    } catch (error) {
      console.error('Get profile error:', error);
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
    // For Frappe, we might need to check session cookies
    // For now, we'll check if we have stored user data
    try {
      const userData = localStorage.getItem('dentcharts_user_data');
      return userData !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current user data from storage
   */
  getCurrentUser(): any | null {
    try {
      const userData = localStorage.getItem('dentcharts_user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();