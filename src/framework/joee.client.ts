import { ApiResponse, ErrorResponse } from '@/lib/types';

export const processResponse = (response: any): any => {
  if (
    response &&
    (response.status === 200 ||
      response.status === 201 ||
      response.status === 202 ||
      response.statusText)
  ) {
    console.log("response success -> ", response.status, response.statusText);
    
    // Handle the new standardized response format
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      const apiResponse = response.data as ApiResponse;
      
      // If it's a success response, return the data
      if (apiResponse.success) {
        return apiResponse;
      } else {
        // If it's an error response, throw it
        throw new Error(apiResponse.message || 'API request failed');
      }
    }
    
    // Handle legacy response format (backward compatibility)
    return Array.isArray(response.data) ? response.data : response.data;
  }
  return response;
};

// Helper function to extract data from standardized response
export const extractData = <T>(response: ApiResponse<T> | T[] | T): T | T[] => {
  // If it's already the new format
  if (response && typeof response === 'object' && 'success' in response) {
    const apiResponse = response as ApiResponse<T>;
    return apiResponse.data as T;
  }
  
  // If it's legacy format (direct data)
  return response as T | T[];
};

// Helper function to extract metadata from standardized response
export const extractMeta = (response: ApiResponse): any => {
  if (response && typeof response === 'object' && 'success' in response) {
    return response.meta;
  }
  return null;
};

// Helper function to check if response is successful
export const isSuccessResponse = (response: any): boolean => {
  if (response && typeof response === 'object' && 'success' in response) {
    return response.success === true;
  }
  return true; // Legacy responses are assumed successful
};
