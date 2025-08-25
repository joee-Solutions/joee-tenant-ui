export const API_ENDPOINTS = {
  REFRESH_TOKEN: "/auth/super/refresh-token",
  LOGIN: "/auth/super/login",
  SIGNUP: "/auth/super/signup",
  LOGOUT: "/auth/super/logout",
  FORGOT_PASSWORD: "/auth/super/forgot-password",
  RESET_PASSWORD: "/auth/super/reset-password",
  VERIFY_EMAIL: "/auth/super/verify-email",
  VERIFY_OTP: "/auth/super/verify-otp",
  VERIFY_LOGIN: "/auth/super/verify-login-otp",
  RESEND_OTP: "/auth/super/resend-otp",
  GET_DASHBOARD_DATA: "super/tenants/dashboard",
  GET_DASHBOARD_APPOINTMENTS: "super/tenants/dashboard/appointments",
  GET_DASHBOARD_USERS: "super/tenants/dashboard/users",
  GET_DASHBOARD_PATIENTS: "super/tenants/dashboard/patients",
  CREATE_TENANTs: "super/tenants",
  GET_ALL_TENANTS: "super/tenants",
  GET_TENANT: (tenantId: string) => `super/tenants/${tenantId}`,
  EDIT_ORGANIZATION: (tenantId: string) => `super/tenants/${tenantId}`,
  TENANTS_DEPARTMENTS: (tenantId: number) =>
    `super/tenants/${tenantId}/departments`,
  TENANTS_PATIENTS: (tenantId: number) => `super/tenants/${tenantId}/patients`,
  TENANTS_APPOINTMENTS: (tenantId: number) =>
    `super/tenants/${tenantId}/appointments`,
  TENANTS_SCHEDULES: (tenantId: number) =>
    `super/tenants/${tenantId}/schedules`,
   TENANTS_EMPLOYEES: (tenantId: number,deptId:number) =>
    `super/tenants/${tenantId}/${deptId}/employees`,
   GET_TENANTS_EMPLOYEES: (tenantId: number) =>
    `super/tenants/${tenantId}/employees`,
   UPDATE_TENANT_EMPLOYEE: (tenantId: number, employeeId: number) =>
     `super/tenants/${tenantId}/employees/${employeeId}`,
  GET_ALL_USERS: "super/tenants",

  //  super admin
  GET_SUPER_ADMIN: "/management/super/admin/all",
  ADD_SUPER_ADMIN: "/auth/super/register",
  
  // Training Guides
  GET_TRAINING_GUIDES: "/management/super/training-guides",
  GET_TRAINING_GUIDE: (id: number) => `/management/super/training-guides/${id}`,
  CREATE_TRAINING_GUIDE: "/management/super/training-guides",
  UPDATE_TRAINING_GUIDE: (id: number) => `/management/super/training-guides/${id}`,
  DELETE_TRAINING_GUIDE: (id: number) => `/management/super/training-guides/${id}`,
  GET_TRAINING_GUIDE_CATEGORIES: "/management/super/training-guides/categories",
  
  // Notifications
  GET_NOTIFICATIONS: "/notifications",
  GET_USER_NOTIFICATIONS: (userId: number) => `/notifications/user/${userId}`,
  GET_TENANT_NOTIFICATIONS: (tenantId: number) => `/notifications/tenant/${tenantId}`,
  MARK_NOTIFICATION_READ: (id: number) => `/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: (userId: number) => `/notifications/user/${userId}/read-all`,
  DELETE_NOTIFICATION: (id: number) => `/notifications/${id}`,
  GET_UNREAD_COUNT: (userId: number) => `/notifications/user/${userId}/unread-count`,
  GET_TENANT_UNREAD_COUNT: (tenantId: number) => `/notifications/tenant/${tenantId}/unread-count`,
  GET_ADMIN_PROFILE: "/management/super/admin/profile",
  CHANGE_PASSWORD: "/auth/super/change-password",
  
  // Roles Management
  GET_ALL_ROLES: "/management/super/roles/all",
  CREATE_ROLE: "/management/super/roles/create",
  UPDATE_ROLE: (roleId: number) => `/management/super/roles/${roleId}/update`,
  
  // Permissions Management
  GET_ALL_PERMISSIONS: "/management/super/permissions/all",
  CREATE_PERMISSION: "/management/super/permissions/create",
  
  // User Role Management
  GET_TENANT_USERS: (orgId: string) => `super/tenants/${orgId}`,
  ASSIGN_ROLES_TO_USER: (userId: number) => `super/tenants/users/${userId}/roles/assign`,
  REMOVE_ROLE_FROM_USER: (userId: number, roleId: number) => `super/tenants/users/${userId}/roles/${roleId}`,
};
