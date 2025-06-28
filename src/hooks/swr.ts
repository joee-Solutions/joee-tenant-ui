import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import useSWR from "swr";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  user?: {
    first_name: string;
    last_name: string;
  };
  tenant?: {
    name: string;
  };
}

interface NotificationResponse {
  notifications?: Notification[];
  total?: number;
  page?: number;
  limit?: number;
}

interface WrappedResponse {
  data?: Notification[];
}

type NotificationData = NotificationResponse | Notification[] | WrappedResponse | undefined;

export const authFectcher = (url: string) =>
  processRequestAuth("get", url);

export const fetcher = (url: string) =>
  processRequestAuth("get", url);

export const useTenant = (slug: string) => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_TENANT(slug),
    authFectcher
  );
  if(error){
    toast.error("Failed to fetch tenant data");
  }

  return {
    data,
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
        console.error('Dashboard data fetch failed:', error);
        toast.error("Failed to load dashboard data");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data,
    isLoading,
    error,
  };
};

// Custom hook for tenants/organizations data
export const useTenantsData = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS,
    authFectcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: data?.data || data,
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
        console.error('Admins fetch failed:', error);
        toast.error("Failed to load admin users");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data,
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
        console.error('Notifications fetch failed:', error);
        toast.error("Failed to load notifications");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data,
    isLoading,
    error,
  };
};

// Custom hook for tab-based notifications filtering
export const useNotificationsByTab = (activeTab: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    activeTab ? `/notifications?tab=${activeTab}` : null,
    async () => {
      const response = await processRequestAuth("get", API_ENDPOINTS.GET_NOTIFICATIONS);
      console.log(response,'ress')
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Process the data to extract notifications and apply tab filtering
  const getFilteredNotifications = (responseData: any) => {
    if (!responseData) {
      return { notifications: [], total: 0 };
    }

    // Extract notifications from the response
    let notifications = [];
    let total = 0;
    
    // Handle the backend response structure: { notifications: [...], total: 7, page: 1, limit: 50 }
    if (responseData.notifications && Array.isArray(responseData.notifications)) {
      notifications = responseData.notifications;
      total = responseData.total || notifications.length;
    } else if (Array.isArray(responseData)) {
      // If response is directly an array
      notifications = responseData;
      total = notifications.length;
    } else {
      console.log('No valid notifications array found in response');
      return { notifications: [], total: 0 };
    }

    let filteredNotifications = notifications;

    // Apply tab filtering
    if (activeTab === "sent") {
      filteredNotifications = notifications.filter((notification: Notification) => 
        notification.type === "SENT" || notification.status === "SENT"
      );
    } else if (activeTab === "received") {
      filteredNotifications = notifications.filter((notification: Notification) => 
        notification.type === "RECEIVED" || notification.status === "RECEIVED"
      );
    }

    return {
      notifications: filteredNotifications,
      total: total,
      originalData: responseData
    };
  };

  const processedData = getFilteredNotifications(data);

  return {
    data: processedData,
    isLoading,
    error,
    mutate,
    activeTab
  };
};

// Custom hook for tenant-specific data
export const useTenantData = (tenantId: string) => {
  const { data, isLoading, error } = useSWR(
    tenantId ? API_ENDPOINTS.GET_TENANT(tenantId) : null,
    authFectcher,
    {
      onError: (error) => {
        console.error('Tenant data fetch failed:', error);
        toast.error("Failed to load tenant data");
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data,
    isLoading,
    error,
  };
};
