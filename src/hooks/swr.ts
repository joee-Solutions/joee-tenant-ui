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

export const authFectcher = (url: string) => processRequestAuth("get", url);

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

// Custom hook for dashboard data
export const useDashboardData = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_DASHBOARD_DATA,
    authFectcher,
    {
      onError: (error) => {
        console.error("Dashboard data fetch failed:", error);
        toast.error("Failed to load dashboard data");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: extractData<DashboardData>(data) as any,
    meta: extractMeta(data),
    isLoading,
    error,
  };
};

// Types for dashboard appointments data
interface AppointmentsByDay {
  day: string;
  male: number;
  female: number;
}

interface DashboardAppointmentsData {
  clinic: string;
  weeklyGrowth: number;
  appointmentsByDay: AppointmentsByDay[];
}

interface DashboardPatientsData {
  totalPatients: number;
  ageDistribution: AgeGroup[];
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
  
  return {
    data: extractData<DashboardAppointmentsData>(data?.data?.data),
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
  console.log('data patients',data?.data)

  console.log('Raw patients API response:', data);
  console.log('Extracted patients data:', extractData<DashboardPatientsData>(data?.data?.data));

  return {
    data: extractData<DashboardPatientsData>(data?.data?.data),
    isLoading,
    error,
  };
};

// Custom hook for dashboard employees data
export const useDashboardEmployees = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_ALL_USERS,
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
  return {
    data: extractData<AdminUser[]>(data?.data?.data),
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

  return {
    data: extractData<any[]>(data) as any,
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
