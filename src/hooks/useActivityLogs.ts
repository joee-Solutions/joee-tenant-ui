import useSWR from 'swr';
import { processRequestAuth } from '@/framework/https';
import { API_ENDPOINTS } from '@/framework/api-endpoints';

export interface ActivityLog {
  id: number;
  userId: string;
  tenantId?: string;
  activityType: 'super_admin' | 'tenant' | 'system';
  action: string;
  resource?: string;
  resourceId?: string;
  status: 'pending' | 'success' | 'failed';
  metadata: {
    method?: string;
    path?: string;
    userAgent?: string;
    ipAddress?: string;
    description?: string;
    changes?: any;
    previousValues?: any;
    newValues?: any;
    error?: string;
    errorCode?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
  };
  userContext?: {
    email?: string;
    name?: string;
    roles?: string[];
    permissions?: string[];
  };
  timestamp: string;
  completedAt?: string;
}

export interface ActivityLogQuery {
  page?: number;
  limit?: number;
  userId?: string;
  tenantId?: string;
  activityType?: 'super_admin' | 'tenant' | 'system';
  action?: string;
  resource?: string;
  status?: 'pending' | 'success' | 'failed';
  startDate?: string;
  endDate?: string;
}

export interface ActivityLogResponse {
  activities: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityStats {
  summary: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: string;
  };
  topActions: Array<{
    action: string;
    count: string;
  }>;
  activityByType: Array<{
    activityType: string;
    count: string;
  }>;
}

// Hook to fetch recent activity logs
export const useRecentActivity = (query: ActivityLogQuery = {}) => {
  const queryString = new URLSearchParams();
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, value.toString());
    }
  });

  const { data, error, isLoading, mutate } = useSWR(
    queryString.toString() ? `/management/super/activity-logs?${queryString}` : null,
    async (url) => {
      const response = await processRequestAuth('get', url);
      return response?.data as ActivityLogResponse;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    activityLogs: data?.activities || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
};

// Hook to fetch activity statistics
export const useActivityStats = (query: Omit<ActivityLogQuery, 'page' | 'limit'> = {}) => {
  const queryString = new URLSearchParams();
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, value.toString());
    }
  });

  const { data, error, isLoading, mutate } = useSWR(
    queryString.toString() ? `/management/super/activity-logs/stats?${queryString}` : null,
    async (url) => {
      const response = await processRequestAuth('get', url);
      return response?.data as ActivityStats;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
    mutate,
  };
};

// Hook to fetch user activity timeline
export const useUserActivityTimeline = (userId: string, days: number = 7) => {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/management/super/activity-logs/user/${userId}/timeline?days=${days}` : null,
    async (url) => {
      const response = await processRequestAuth('get', url);
      return response?.data as ActivityLog[];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    timeline: data || [],
    isLoading,
    error,
    mutate,
  };
};

// Hook to fetch tenant activity summary
export const useTenantActivitySummary = (tenantId: string, days: number = 30) => {
  const { data, error, isLoading, mutate } = useSWR(
    tenantId ? `/management/super/activity-logs/tenant/${tenantId}/summary?days=${days}` : null,
    async (url) => {
      const response = await processRequestAuth('get', url);
      return response?.data as {
        totalActivities: number;
        activityByDate: Record<string, ActivityLog[]>;
        recentActivities: ActivityLog[];
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    summary: data,
    isLoading,
    error,
    mutate,
  };
};

// Hook to fetch super admin activity logs
export const useSuperAdminActivity = (query: Omit<ActivityLogQuery, 'activityType'> = {}) => {
  const queryString = new URLSearchParams();
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, value.toString());
    }
  });

  const { data, error, isLoading, mutate } = useSWR(
    queryString.toString() ? `/management/super/activity-logs/super-admin?${queryString}` : null,
    async (url) => {
      const response = await processRequestAuth('get', url);
      return response?.data as ActivityLogResponse;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    activityLogs: data?.activities || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
};

// Hook to fetch tenant activity logs
export const useTenantActivity = (query: Omit<ActivityLogQuery, 'activityType'> = {}) => {
  const queryString = new URLSearchParams();
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, value.toString());
    }
  });

  const { data, error, isLoading, mutate } = useSWR(
    queryString.toString() ? `/management/super/activity-logs/tenants?${queryString}` : null,
    async (url) => {
      const response = await processRequestAuth('get', url);
      return response?.data as ActivityLogResponse;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    activityLogs: data?.activities || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
};

// Hook to fetch failed activity logs
export const useFailedActivity = (query: Omit<ActivityLogQuery, 'status'> = {}) => {
  const queryString = new URLSearchParams();
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, value.toString());
    }
  });

  const { data, error, isLoading, mutate } = useSWR(
    queryString.toString() ? `/management/super/activity-logs/failed?${queryString}` : null,
    async (url) => {
      const response = await processRequestAuth('get', url);
      return response?.data as ActivityLogResponse;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    activityLogs: data?.activities || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
}; 