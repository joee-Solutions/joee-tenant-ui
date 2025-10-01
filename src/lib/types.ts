export interface Organization {
    id: number;
    name: string;
    location: string;
    status: 'Active' | 'Inactive' | 'Deactivated';
    image: string;
  }
  
  export interface Employee {
    id: number;
    name: string;
    role: string;
    organization: string;
    description?: string;
    image: string;
  }
  export interface User {
    id: number;
    name: string;
    role: string;
    organization: string;
    description?: string;
    image: string;
  }
  
  export interface Patient {
    id: number;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    condition: string;
    organization: string;
  }
  
  export interface AgeGroup {
    range: string;
    percentage: number;
    color: string;
  }
  
  export interface AppointmentData {
    day: string;
    male: number;
    female: number;
  }
  
  export interface StatData {
    count: number;
    growth: number | null;
  }

// Standardized API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

// Specific data types
export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  roles: string[];
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  domain: string;
  email: string;
  address?: string;
  website?: string;
  phone_number?: string;
  fax_number?: string;
  logo?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED';
  created_at: string;
  updated_at: string;
}

export interface TrainingGuide {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  is_featured: boolean;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  guide_version: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  deactivatedTenants: number;
}

export interface Notification {
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