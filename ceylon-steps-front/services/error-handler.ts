import { ErrorResponse } from '../interfaces/auth.interface';

export const getApiErrorMessage = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data;
    
    // Handle NestJS validation errors (array of messages)
    if (Array.isArray(data.message)) {
      return data.message[0];
    }
    
    // Handle standard message string
    if (typeof data.message === 'string') {
      return data.message;
    }

    // Handle generic error field
    if (data.error) {
      return data.error;
    }
  }

  // Handle Axios generic errors
  if (error.message === 'Network Error') {
    return 'Unable to connect to server. Please check your internet connection.';
  }

  return error.message || 'An unexpected error occurred';
};
