import toast from 'react-hot-toast';

/**
 * API Error types
 */
export interface APIError extends Error {
  status_code?: number;
  message: string;
  details?: any;
}

/**
 * Enhanced error handling for API responses
 */
export const handleAPIError = (error: any, customMessage?: string): APIError => {
  console.error('API Error:', error);

  // Extract error information from different response formats
  let status_code: number | undefined;
  let message: string;
  let details: any;

  if (error?.response) {
    // Axios error
    status_code = error.response.status;
    message = error.response.data?.message || error.response.data?.error || error.message;
    details = error.response.data;
  } else if (error?.status_code) {
    // Custom API error
    status_code = error.status_code;
    message = error.message || 'An API error occurred';
    details = error.details;
  } else if (error instanceof Error) {
    // Regular Error object
    message = error.message;
  } else if (typeof error === 'string') {
    // String error
    message = error;
  } else {
    // Unknown error format
    message = 'An unexpected error occurred';
  }

  // Use custom message if provided
  if (customMessage) {
    message = customMessage;
  }

  // Create standardized API error
  const apiError: APIError = new Error(message) as APIError;
  apiError.status_code = status_code;
  apiError.details = details;

  return apiError;
};

/**
 * Show error toast notification
 */
export const showErrorToast = (error: any, fallbackMessage = 'Something went wrong') => {
  const apiError = handleAPIError(error);
  
  // Don't show toast for certain error types
  if (apiError.status_code === 401) {
    // Handled by auth interceptor
    return;
  }
  
  toast.error(apiError.message || fallbackMessage);
};

/**
 * Show success toast notification
 */
export const showSuccessToast = (message: string) => {
  toast.success(message);
};

/**
 * Show loading toast notification
 */
export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

/**
 * Dismiss toast notification
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Network error handling
 */
export const isNetworkError = (error: any): boolean => {
  return (
    !error.response &&
    (error.code === 'NETWORK_ERROR' ||
     error.message === 'Network Error' ||
     error.message?.includes('fetch'))
  );
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  const apiError = handleAPIError(error);
  
  // Retry on network errors
  if (isNetworkError(error)) {
    return true;
  }
  
  // Retry on server errors (5xx)
  if (apiError.status_code && apiError.status_code >= 500) {
    return true;
  }
  
  // Don't retry on client errors (4xx)
  return false;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry on client errors (4xx)
      if (!isRetryableError(error)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorToast(event.reason, 'An unexpected error occurred');
    
    // Prevent the default browser console error
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    showErrorToast(event.error, 'An unexpected error occurred');
  });
};