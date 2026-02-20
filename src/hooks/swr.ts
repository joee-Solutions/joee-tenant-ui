import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import useSWR from "swr";
import {
  AdminUser,
  Tenant,
  TrainingGuide,
  DashboardData,
  Notification,
  Employee,
  AgeGroup,
} from "@/lib/types";
import { extractData, extractMeta } from "@/framework/joee.client";

// Define OrganizationUser interface based on actual API response
export interface OrganizationUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone_number?: string;
  address?: string;
  region?: string;
  specialty?: string;
  designation?: string;
  gender?: string;
  date_of_birth?: string;
  hire_date?: string;
  image_url?: string;
  about?: string;
  is_active: boolean;
  user_key: string;
  last_login?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  version: number;
  tenant?: {
    id: number;
    name: string;
    domain: string;
    email: string;
    phone_number?: string;
    fax_number?: string;
    website?: string;
    is_active: boolean;
    is_email_verified: boolean;
    registration_complete: boolean;
    last_active?: string;
    disabled: boolean;
    address?: string;
    address_metadata?: any;
    logo?: string;
    status: string;
    organization_id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    version: number;
  };
}

export const authFectcher = async (url: string) => {
  try {
    return await processRequestAuth("get", url);
  } catch (error: any) {
    // If request fails and we're offline or have network issues, try to get cached data
    if (typeof window !== 'undefined') {
      const isOffline = !navigator.onLine;
      const statusCode = error?.response?.status;
      const isNetworkError = error?.code === 'ERR_NETWORK' || 
                            error?.message?.includes('Network') ||
                            error?.message?.includes('timeout') ||
                            statusCode >= 500;
      // Also check for 401 (unauthorized) - might be temporary API issue, use cache if available
      const isAuthError = statusCode === 401;
      
      if (isOffline || isNetworkError || isAuthError) {
        try {
          const { offlineService } = await import('@/lib/offline/offlineService');
          // Parse URL to handle query parameters
          let basePath = url;
          let queryString = '';
          
          try {
            // Try to parse as full URL
            const urlObj = new URL(url.startsWith('http') ? url : `http://localhost${url.startsWith('/') ? url : `/${url}`}`);
            basePath = urlObj.pathname;
            queryString = urlObj.search;
          } catch {
            // If URL parsing fails, try to extract path and query manually
            const queryIndex = url.indexOf('?');
            if (queryIndex !== -1) {
              basePath = url.substring(0, queryIndex);
              queryString = url.substring(queryIndex);
            } else {
              basePath = url;
            }
          }
          
          // Try multiple cache key formats since endpoints might be stored differently
          const cacheKeys = [
            url, // Original URL
            url.startsWith('/') ? url : `/${url}`, // With leading slash
            basePath, // Base path without query
            basePath.startsWith('/') ? basePath : `/${basePath}`, // Base path with leading slash
            queryString ? `${basePath}${queryString}` : basePath, // Base path with query
            url.replace(/^\/api/, ''), // Remove /api prefix if present
            url.replace(/^\/api/, '').startsWith('/') ? url.replace(/^\/api/, '') : `/${url.replace(/^\/api/, '')}`, // Without /api and with slash
          ];
          
          // Remove duplicates
          const uniqueCacheKeys = [...new Set(cacheKeys)];
          
          for (const cacheKey of uniqueCacheKeys) {
            const cachedData = await offlineService.getCachedResponse(cacheKey);
            if (cachedData) {
              console.log('✅ Using cached data for:', url, '(matched key:', cacheKey, ')');
              // Suppress the error by returning cached data successfully
              return cachedData;
            }
          }
        } catch (cacheError) {
          // Silently fail - no cached data available
          console.warn('No cached data available for:', url, cacheError);
        }
      }
    }
    
    // If offline and error message indicates no cache, modify error message to be more user-friendly
    if (typeof window !== 'undefined' && !navigator.onLine && error?.message?.includes('No cached data available')) {
      const friendlyError = new Error('No cached data available. Please connect to the internet to load this page, or visit it while online to cache it for offline use.');
      (friendlyError as any).isOfflineError = true;
      throw friendlyError;
    }
    
    // Re-throw error if no cached data available
    throw error;
  }
};

export const fetcher = (url: string) => processRequestAuth("get", url);

export const useTenant = (slug: string) => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_TENANT(slug),
    authFectcher
  );
  if (error) {
    toast.error("Failed to fetch tenant data");
  }

  return {
    data: extractData<Tenant>(data),
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Helper function to check if error is a syntax error
const isSyntaxError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = error?.message || '';
  const errorData = error?.response?.data || {};
  const errorString = JSON.stringify(errorData).toLowerCase();
  return (
    errorMessage.toLowerCase().includes('syntax error') ||
    errorString.includes('syntax error') ||
    error?.response?.status === 500
  );
};

// Custom fetcher that handles syntax errors gracefully for dashboard data
const dashboardDataFetcher = async (url: string) => {
  try {
    return await authFectcher(url);
  } catch (error: any) {
    // Silently handle syntax errors - return null to use fallback data
    if (isSyntaxError(error)) {
      console.warn('Dashboard data endpoint error (using fallback):', {
        status: error?.response?.status,
        error: error?.response?.data?.error || error?.message
      });
      return null;
    }
    // Re-throw other errors
    throw error;
  }
};

// Custom hook for dashboard data
export const useDashboardData = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_DASHBOARD_DATA,
    dashboardDataFetcher,
    {
      onError: (error) => {
        // Only show toast for non-syntax errors
        if (!isSyntaxError(error)) {
        console.error("Dashboard data fetch failed:", error);
        toast.error("Failed to load dashboard data");
        }
      },
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Handle different response structures
  let dashboardData: DashboardData | null = null;
  
  if (data) {
    // Try to extract data from different possible structures
    const extracted = extractData<DashboardData>(data);
    
    // If extracted is an object with dashboard fields, use it directly
    if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
      dashboardData = extracted as DashboardData;
    } 
    // If data has a nested data property
    else if (data && typeof data === 'object' && 'data' in data && typeof (data as any).data === 'object') {
      dashboardData = (data as any).data as DashboardData;
    }
    // If data itself is the dashboard data
    else if (data && typeof data === 'object' && ('totalTenants' in data || 'activeTenants' in data)) {
      dashboardData = data as DashboardData;
    }
  }

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard API Response:', data);
    console.log('Extracted Dashboard Data:', dashboardData);
  }

  return {
    data: dashboardData,
    meta: extractMeta(data),
    isLoading,
    // Don't expose syntax errors as errors - treat them as successful with null data
    error: error && !isSyntaxError(error) ? error : null,
  };
};

// Helper function to extract nested data from response
const extractNestedData = (responseData: any): any => {
  if (!responseData || typeof responseData !== 'object') return null;
  
  // If data has success field, it's a standardized response
  if ('success' in responseData && responseData.success && 'data' in responseData) {
    // Check if data.data has nested structure
    if (responseData.data && typeof responseData.data === 'object' && 'data' in responseData.data) {
      return responseData.data.data;
    } else {
      return responseData.data;
    }
  } else if ('data' in responseData) {
    // Check for nested data.data.data structure
    if (responseData.data && typeof responseData.data === 'object' && 'data' in responseData.data) {
      return responseData.data.data;
    } else {
      return responseData.data;
    }
  } else {
    return responseData;
  }
};

// Types for dashboard appointments data
interface AppointmentsByDay {
  day: string;
  male: number;
  female: number;
}

interface DashboardAppointmentsData {
  totalAppointments?: number;
  latestAppointments?: any[];
  clinic?: string;
  weeklyGrowth?: number;
  appointmentsByDay?: AppointmentsByDay[];
}

interface DashboardPatientsData {
  totalPatients: number;
  averageAge?: number;
  ageGroups?: {
    [key: string]: number;
  };
  ageDistribution?: AgeGroup[];
}
// Custom hook for dashboard appointments data
export const useDashboardAppointments = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_DASHBOARD_APPOINTMENTS,
    authFectcher,
    {
      onError: (error) => {
        console.error("Dashboard appointments fetch failed:", error);
        toast.error("Failed to load dashboard appointments");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  
  const rawData = extractNestedData(data);
  const extractedData = extractData<DashboardAppointmentsData>(rawData);
  
  // Transform latestAppointments to appointmentsByDay if needed
  let transformedData: DashboardAppointmentsData | null = null;
  
  // Ensure extractedData is a single object, not an array
  const dataObj = Array.isArray(extractedData) ? null : (extractedData as DashboardAppointmentsData);
  
  if (dataObj) {
    transformedData = { ...dataObj };
    
    // If we have latestAppointments but no appointmentsByDay, transform it
    if (dataObj.latestAppointments && Array.isArray(dataObj.latestAppointments) && !dataObj.appointmentsByDay) {
      // Group appointments by day of week and count by gender
      const dayMap = new Map<string, { male: number; female: number }>();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      dataObj.latestAppointments.forEach((appointment: any) => {
        if (appointment.date || appointment.appointmentDate || appointment.createdAt) {
          const dateStr = appointment.date || appointment.appointmentDate || appointment.createdAt;
          const date = new Date(dateStr);
          const dayName = dayNames[date.getDay()];
          
          if (dayName) {
            const current = dayMap.get(dayName) || { male: 0, female: 0 };
            const gender = (appointment.gender || appointment.patient?.gender || '').toLowerCase();
            
            if (gender === 'male' || gender === 'm') {
              current.male += 1;
            } else if (gender === 'female' || gender === 'f') {
              current.female += 1;
            }
            
            dayMap.set(dayName, current);
          }
        }
      });
      
      // Convert map to array format expected by chart
      transformedData.appointmentsByDay = dayNames.map(day => ({
        day,
        male: dayMap.get(day)?.male || 0,
        female: dayMap.get(day)?.female || 0,
      }));
    } else if (!transformedData.appointmentsByDay) {
      // If no appointmentsByDay and no latestAppointments, use empty array
      transformedData.appointmentsByDay = [];
    }
    
    // Set defaults for clinic and weeklyGrowth if not present
    if (!transformedData.clinic) {
      transformedData.clinic = "All Organizations";
    }
    if (transformedData.weeklyGrowth === undefined) {
      transformedData.weeklyGrowth = 0;
    }
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard Appointments - Raw response:', data);
    console.log('Dashboard Appointments - Raw data:', rawData);
    console.log('Dashboard Appointments - Extracted data:', extractedData);
    console.log('Dashboard Appointments - Transformed data:', transformedData);
  }
  
  return {
    data: transformedData,
    totalAppointments: transformedData?.totalAppointments || 0,
    isLoading,
    error,
  };
};

// Custom hook for dashboard patients data
export const useDashboardPatients = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_DASHBOARD_PATIENTS,
    authFectcher,
    {
      onError: (error) => {
        console.error("Dashboard patients fetch failed:", error);
        toast.error("Failed to load dashboard patients");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  
  const rawData = extractNestedData(data);
  const extractedData = extractData<DashboardPatientsData>(rawData);
  
  // Transform ageGroups object to ageDistribution array if needed
  let transformedData: DashboardPatientsData | null = null;
  
  // Ensure extractedData is a single object, not an array
  const dataObj = Array.isArray(extractedData) ? null : (extractedData as DashboardPatientsData);
  
  if (dataObj) {
    transformedData = { ...dataObj };
    
    // If we have ageGroups object but no ageDistribution array, transform it
    if (dataObj.ageGroups && !dataObj.ageDistribution) {
      const ageGroupColors: { [key: string]: string } = {
        "0-18": "#003465",
        "19-25": "#FAD900",
        "26-50": "#3FA907",
        "50+": "#EC0909",
      };
      
      const total = dataObj.totalPatients || 0;
      const ageDistribution: AgeGroup[] = Object.entries(dataObj.ageGroups)
        .sort(([a], [b]) => {
          // Sort by age range: 0-18, 19-25, 26-50, 50+
          const order = ["0-18", "19-25", "26-50", "50+"];
          const indexA = order.indexOf(a);
          const indexB = order.indexOf(b);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        })
        .map(([range, count]) => ({
          range,
          percentage: total > 0 ? Math.round((Number(count) / total) * 100) : 0,
          color: ageGroupColors[range] || "#999999",
        }));
      
      transformedData.ageDistribution = ageDistribution;
    }
  }

  return {
    data: transformedData,
    isLoading,
    error,
  };
};

// Interface for dashboard employees response
interface DashboardEmployeesResponse {
  totalTenantUsers: number;
  latestUsers: Array<{
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    image: string | null;
    tenant: string;
    designation: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

// Custom hook for dashboard employees data
export const useDashboardEmployees = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_DASHBOARD_USERS,
    authFectcher,
    {
      onError: (error) => {
        console.error("Dashboard employees fetch failed:", error);
        toast.error("Failed to load dashboard employees");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  
  // Handle nested response structure: data.data.data or data.data or data
  // Check if response has success field (standardized API response)
  let rawData: any = null;
  if (data && typeof data === 'object') {
    // If data has success field, it's a standardized response
    if ('success' in data && data.success && 'data' in data) {
      // Check if data.data has nested structure
      if (data.data && typeof data.data === 'object' && 'data' in data.data) {
        rawData = data.data.data;
      } else {
        rawData = data.data;
      }
    } else if ('data' in data) {
      // Check for nested data.data.data structure
      if (data.data && typeof data.data === 'object' && 'data' in data.data) {
        rawData = data.data.data;
      } else {
        rawData = data.data;
      }
    } else {
      rawData = data;
    }
  }
  
  // Extract latestUsers from the response
  let employeesData: any[] = [];
  if (rawData && typeof rawData === 'object') {
    // Check if it has latestUsers array
    if ('latestUsers' in rawData && Array.isArray(rawData.latestUsers)) {
      employeesData = rawData.latestUsers;
    } else if (Array.isArray(rawData)) {
      // If rawData is already an array, use it directly
      employeesData = rawData;
    } else {
      // Try to extract using extractData
      const extracted = extractData<any>(rawData);
      if (Array.isArray(extracted)) {
        employeesData = extracted;
      } else if (extracted && typeof extracted === 'object' && 'latestUsers' in extracted) {
        employeesData = Array.isArray(extracted.latestUsers) ? extracted.latestUsers : [];
      }
    }
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard Employees - Raw response:', data);
    console.log('Dashboard Employees - Raw data:', rawData);
    console.log('Dashboard Employees - Employees data:', employeesData);
    console.log('Dashboard Employees - Is array:', Array.isArray(employeesData));
    console.log('Dashboard Employees - Length:', employeesData.length);
  }
  
  return {
    data: employeesData,
    totalUsers: rawData?.totalTenantUsers || 0,
    isLoading,
    error,
  };
};

// Custom hook for all users across all organizations
export const useAllUsersData = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_ALL_USERS,
    authFectcher,
    {
      onError: (error) => {
        toast.error("Failed to load all users");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  return {
    data: extractData<OrganizationUser[]>(data?.data.data),
    isLoading,
    error,
  };
};

// Custom hook for all patients across all organizations
export const useAllPatientsData = () => {
  const { data, isLoading, error } = useSWR(
    "/super/tenants/patients",
    authFectcher,
    {
      onError: (error) => {
        toast.error("Failed to load all patients");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  return {
    data: extractData<any[]>(data?.data?.data),
    isLoading,
    error,
  };
};

// Custom hook for patients in a specific organization
export const useTenantPatientsData = (orgId: string) => {
  const { data, isLoading, error } = useSWR(
    orgId ? `/super/tenants/${orgId}/patients` : null,
    authFectcher,
    {
      onError: (error) => {
        toast.error("Failed to load tenant patients");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  return {
    data: extractData<any[]>(data),
    isLoading,
    error,
  };
};

// Interface for recent activity items
export interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  organization?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  metadata?: any;
}

// Custom hook for recent activity data
export const useRecentActivityData = (limit: number = 10) => {
  const { data, isLoading, error } = useSWR(
    `/super/tenants/activity/recent?limit=${limit}`,
    authFectcher,
    {
      onError: (error) => {
        toast.error("Failed to load recent activity");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  return {
    data: extractData<RecentActivity[]>(data),
    isLoading,
    error,
  };
};

// Custom hook for tenants/organizations data
export const useTenantsData = (filters?: { search?: string; sort?: string; status?: string; page?: number; limit?: number }) => {
  let endpoint = API_ENDPOINTS.GET_ALL_TENANTS;
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (Array.from(params).length > 0) endpoint += `?${params.toString()}`;
  const { data, isLoading, error } = useSWR(endpoint, authFectcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });
  return {
    data: extractData<Tenant[]>(data) as any,
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Custom hook for admin users data
export const useAdminUsersData = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_SUPER_ADMIN,
    authFectcher,
    {
      onError: (error) => {
        console.error("Admins fetch failed:", error);
        toast.error("Failed to load admin users");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<AdminUser[]>(data),
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Custom hook for tenant users data
export const useTenantUsersData = (orgId: string) => {
  const { data, isLoading, error } = useSWR(
    orgId ? API_ENDPOINTS.GET_TENANT_USERS(orgId) : null,
    authFectcher,
    {
      onError: (error) => {
        console.error("Tenant users fetch failed:", error);
        toast.error("Failed to load tenant users");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<AdminUser[]>(data?.data.data),
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Custom hook for notifications data
export const useNotificationsData = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_NOTIFICATIONS,
    authFectcher,
    {
      onError: (error) => {
        console.error("Notifications fetch failed:", error);
        toast.error("Failed to load notifications");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<Notification[]>(data),
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Custom hook for tab-based notifications filtering
export const useNotificationsByTab = (activeTab: string) => {
  const endpoint = `${API_ENDPOINTS.GET_NOTIFICATIONS}${activeTab !== "all" ? `?tab=${activeTab}` : ""}`;
  const { data, error, isLoading, mutate } = useSWR(
    endpoint,
    authFectcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<Notification[]>(data),
    meta: extractMeta(data),
    isLoading,
    error,
    mutate,
  };
};

// Custom hook for tenant-specific data
export const useTenantData = (tenantId: string) => {
  const { data, isLoading, error } = useSWR(
    tenantId ? API_ENDPOINTS.GET_TENANT(tenantId) : null,
    authFectcher,
    {
      onError: (error) => {
        console.error("Tenant data fetch failed:", error);
        toast.error("Failed to load tenant data");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<Tenant>(data),
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Custom hook for training guides data
export const useTrainingGuidesData = (filters?: {
  category?: string;
  status?: string;
  is_featured?: boolean;
}) => {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.is_featured !== undefined)
    params.append("is_featured", String(filters.is_featured));

  const endpoint = `${API_ENDPOINTS.GET_TRAINING_GUIDES}?${params.toString()}`;

  const { data, isLoading, error, mutate } = useSWR(endpoint, authFectcher, {
    onError: (error) => {
      console.error("Training guides fetch failed:", error);
      toast.error("Failed to load training guides");
    },
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Extract data - handle both direct array and nested structure
  const extractedData = extractData<any>(data);
  
  // Handle different response structures:
  // 1. Direct array: data = [...]
  // 2. Object with guides: data = { guides: [...] }
  // 3. Nested: data = { data: { guides: [...] } }
  let guides: any[] = [];
  if (Array.isArray(extractedData)) {
    guides = extractedData;
  } else if (extractedData?.guides && Array.isArray(extractedData.guides)) {
    guides = extractedData.guides;
  } else if (extractedData?.data?.guides && Array.isArray(extractedData.data.guides)) {
    guides = extractedData.data.guides;
  }

  return {
    data: { guides },
    meta: extractMeta(data),
    isLoading,
    error,
    mutate,
  };
};

// Custom hook for training guide categories
export const useTrainingGuideCategories = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_TRAINING_GUIDE_CATEGORIES,
    authFectcher,
    {
      onError: (error) => {
        console.error("Training guide categories fetch failed:", error);
        toast.error("Failed to load categories");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<string[]>(data),
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Custom hook for single training guide
export const useTrainingGuide = (id: number) => {
  const { data, isLoading, error, mutate } = useSWR(
    id ? API_ENDPOINTS.GET_TRAINING_GUIDE(id) : null,
    authFectcher,
    {
      onError: (error) => {
        console.error("Training guide fetch failed:", error);
        toast.error("Failed to load training guide");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<TrainingGuide>(data),
    meta: extractMeta(data),
    isLoading,
    error,
    mutate,
  };

};
export const useAdminProfile = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_ADMIN_PROFILE,
    authFectcher
  );
  return {
    data: extractData<AdminUser>(data),
    meta: extractMeta(data),
    isLoading,
    error,
  };
};
