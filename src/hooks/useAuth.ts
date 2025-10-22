import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../api/services';
import {
  LoginRequest,
  RegisterRequest,
  PractitionerProfile,
  LoginResponse,
} from '../api/types';
import { queryKeys, mutationKeys } from '../api/queryClient';
import toast from 'react-hot-toast';

/**
 * Hook for login functionality
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.auth.login(),
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data: LoginResponse) => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      toast.success('Login successful!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    },
  });
};

/**
 * Hook for registration functionality
 */
export const useRegister = () => {
  return useMutation({
    mutationKey: mutationKeys.auth.register(),
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: () => {
      toast.success('Registration successful! Please login to continue.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed');
    },
  });
};

/**
 * Hook for logout functionality
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.auth.logout(),
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all queries from cache
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      // Still perform local logout even if API fails
      queryClient.clear();
      toast.error(error.message || 'Logout failed');
    },
  });
};

/**
 * Hook for getting practitioner profile
 */
export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => authService.getProfile(),
    enabled: authService.isAuthenticated(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status_code === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook for updating practitioner profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.auth.updateProfile(),
    mutationFn: (profileData: Partial<PractitionerProfile>) =>
      authService.updateProfile(profileData),
    onSuccess: (updatedProfile) => {
      // Update the profile query cache
      queryClient.setQueryData(queryKeys.auth.profile(), updatedProfile);
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

/**
 * Hook for checking authentication status
 */
export const useAuth = () => {
  const { data: profile, isLoading, error } = useProfile();
  const isAuthenticated = authService.isAuthenticated();

  return {
    user: profile,
    isAuthenticated,
    isLoading,
    error,
  };
};

/**
 * Hook that provides authentication state and actions
 */
export const useAuthActions = () => {
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const { user, isAuthenticated, isLoading } = useAuth();

  return {
    // State
    user,
    isAuthenticated,
    isLoading: isLoading || login.isPending || logout.isPending,

    // Actions
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
    updateProfile: updateProfile.mutateAsync,

    // Loading states for individual actions
    isLoginPending: login.isPending,
    isRegisterPending: register.isPending,
    isLogoutPending: logout.isPending,
    isUpdateProfilePending: updateProfile.isPending,

    // Error states
    loginError: login.error,
    registerError: register.error,
    logoutError: logout.error,
    updateProfileError: updateProfile.error,
  };
};