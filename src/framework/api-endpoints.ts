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
};
