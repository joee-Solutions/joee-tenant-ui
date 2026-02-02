"use client";
import { NextPage } from "next";
// import Head from 'next/head';
import StatCard from "@/components/dashboard/StatCard";
import AppointmentsChart from "@/components/dashboard/AppointmentsChart";
import EmployeeSection from "@/components/dashboard/EmployeeSection";
import PatientsDonut from "@/components/dashboard/PatientsDonut";
import OrganizationList from "@/components/dashboard/OrganizationList";
import OrganizationStatus from "@/components/dashboard/OrganizationStatus";
import { colors } from "@/utils/dashboard";
import { useDashboardAppointments, useDashboardPatients } from "@/hooks/swr";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { useDashboardData } from "@/hooks/swr";
import { useDashboardEmployees } from "@/hooks/swr";
import type { User } from "@/lib/types";
import { useTenantsData } from "@/hooks/swr";
import useSWR from "swr";
import { authFectcher } from "@/hooks/swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { extractData } from "@/framework/joee.client";
import type { Tenant } from "@/lib/types";
import { useTenantStore } from "@/contexts/AuthProvider";
import { Building2, UserRoundPlus, UserRound } from "lucide-react";

// import { Organization, Employee, Patient } from '@/lib/types';

// Types for chart data
type AppointmentsByDay = {
  day: string;
  male: number;
  female: number;
};

type AgeGroup = {
  range: string;
  percentage: number;
  color: string;
};

type DashboardAppointmentsData = {
  clinic: string;
  weeklyGrowth: number;
  appointmentsByDay: AppointmentsByDay[];
};

type DashboardPatientsData = {
  totalPatients: number;
  ageDistribution: AgeGroup[];
};

// Type guard for tenant
function hasTenant(obj: unknown): obj is { tenant: { name?: string } } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'tenant' in obj &&
    typeof (obj as { tenant?: unknown }).tenant === 'object' &&
    (obj as { tenant?: unknown }).tenant !== null
  );
}

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

const DashboardPage: NextPage = () => {
  // Fetch stat card data from separate endpoints
  const { data: allTenantsData, isLoading: loadingAllTenants } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS,
    authFectcher,
    { revalidateOnFocus: false }
  );
  
  const { data: activeTenantsData, isLoading: loadingActiveTenants } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS_ACTIVE,
    authFectcher,
    { revalidateOnFocus: false }
  );
  
  const { data: inactiveTenantsData, isLoading: loadingInactiveTenants } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS_INACTIVE,
    authFectcher,
    { revalidateOnFocus: false }
  );

  // Extract and count tenants from each endpoint
  const allTenantsRaw: any = extractData<Tenant | Tenant[]>(allTenantsData);
  const activeTenantsRaw: any = extractData<Tenant | Tenant[]>(activeTenantsData);
  const inactiveTenantsRaw: any = extractData<Tenant | Tenant[]>(inactiveTenantsData);
  
  // Helper function to normalize to array (handle nested arrays and single objects)
  const normalizeToArray = (data: any): Tenant[] => {
    if (!data) return [];
    if (Array.isArray(data)) {
      // Flatten if nested arrays exist
      const flattened = data.flat();
      // Ensure all items are Tenant objects (not arrays)
      return flattened.filter((item): item is Tenant => 
        item && typeof item === 'object' && 'id' in item && !Array.isArray(item)
      );
    }
    // Single object
    if (data && typeof data === 'object' && 'id' in data) {
      return [data as Tenant];
    }
    return [];
  };
  
  // Ensure we have arrays (handle both single object and array responses)
  const allTenants = normalizeToArray(allTenantsRaw);
  const activeTenants = normalizeToArray(activeTenantsRaw);
  const inactiveTenants = normalizeToArray(inactiveTenantsRaw);
  
  // Calculate counts
  const totalTenantsCount = allTenants.length;
  const activeTenantsCount = activeTenants.length;
  const inactiveTenantsCount = inactiveTenants.length;
  
  const isLoadingStats = loadingAllTenants || loadingActiveTenants || loadingInactiveTenants;
  
  const { data: appointmentsData, isLoading: loadingAppointments, error: errorAppointments } = useDashboardAppointments();
  const { data: patientsData, isLoading: loadingPatients, error: errorPatients } = useDashboardPatients();
  const { data: employeesData, isLoading: loadingEmployees, error: errorEmployees } = useDashboardEmployees();
  const { data: tenantsData, isLoading: loadingTenants, error: errorTenants } = useTenantsData({ limit: 4 });
  const user = useTenantStore(state => state.state.user);
  const fallbackAppointmentsData: DashboardAppointmentsData = {
    clinic: " Clinic",
    weeklyGrowth: 8,
    appointmentsByDay: [
      { day: "Monday", male: 12, female: 15 },
      { day: "Tuesday", male: 10, female: 14 },
      { day: "Wednesday", male: 13, female: 12 },
      { day: "Thursday", male: 11, female: 16 },
      { day: "Friday", male: 14, female: 15 },
      { day: "Saturday", male: 9, female: 11 },
      { day: "Sunday", male: 8, female: 10 },
    ],
  };
  const fallbackPatientsData: DashboardPatientsData = {
    totalPatients: 1240,
    ageDistribution: [
      { range: "0-18", percentage: 18, color: "#003465" },
      { range: "19-30", percentage: 32, color: "#FAD900" },
      { range: "31-45", percentage: 24, color: "#3FA907" },
      { range: "46-60", percentage: 16, color: "#EC0909" },
      { range: "60+", percentage: 10, color: "#999999" },
    ],
  };
  const appointmentsChartData: DashboardAppointmentsData =
    !errorAppointments &&
    appointmentsData &&
    !Array.isArray(appointmentsData) &&
    (appointmentsData as DashboardAppointmentsData)?.appointmentsByDay?.length
      ? (appointmentsData as DashboardAppointmentsData)
      : fallbackAppointmentsData;
  const patientsDonutData: DashboardPatientsData =
    !errorPatients &&
    patientsData &&
    !Array.isArray(patientsData) &&
    (patientsData as DashboardPatientsData)?.ageDistribution?.length
      ? (patientsData as DashboardPatientsData)
      : fallbackPatientsData;
  const organizations = Array.isArray(tenantsData)
    ? tenantsData.filter((t): t is import("@/lib/types").Tenant => typeof t === 'object' && t !== null && 'id' in t && 'name' in t)
      .slice(0, 4)
      .map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        location: tenant.address || tenant.domain || "-",
        status:
          tenant.status === "active"
            ? "Active"
            : tenant.status === "inactive"
              ? "Inactive"
              : tenant.status === "deactivated"
                ? "Deactivated"
                : "Inactive",
        image: tenant.logo || "/assets/images/profilepic.png",
      }))
    : [];

  // Custom fetcher that handles errors gracefully for /organization/status
  const orgStatusFetcher = async (url: string) => {
    try {
      return await authFectcher(url);
    } catch (error: any) {
      // Silently handle syntax errors and 500 errors from /organization/status endpoint
      if (isSyntaxError(error)) {
        console.warn('Organization status endpoint error (using fallback):', {
          status: error?.response?.status,
          error: error?.response?.data?.error || error?.message
        });
        // Return null to trigger fallback stats - SWR will treat this as successful but with null data
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  };

  const { data: orgStatusData, isLoading: loadingOrgStatus, error: errorOrgStatus } = useSWR(
    "/organization/status",
    orgStatusFetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Don't show error if it's a syntax error - just use fallback
      onError: (error) => {
        // Only log non-syntax errors
        if (!isSyntaxError(error)) {
          console.error('Organization status fetch error:', error);
        }
      },
    }
  );
  const organizationStats = orgStatusData && typeof orgStatusData === 'object' && orgStatusData.data ? {
    activeCount: orgStatusData.data.activeTenants || 0,
    inactiveCount: orgStatusData.data.inactiveTenants || 0,
    deactivatedCount: orgStatusData.data.deactivatedTenants || 0,
    totalCount: orgStatusData.data.totalTenants || 0,
    completionPercentage: orgStatusData.data.totalTenants
      ? Math.round(((orgStatusData.data.activeTenants || 0) * 100) / orgStatusData.data.totalTenants)
      : 0,
  } : {
    activeCount: 0,
    inactiveCount: 0,
    deactivatedCount: 0,
    totalCount: 0,
    completionPercentage: 0,
  };

  // Calculate growth percentages
  const growth = {
    allOrganizations: null,
    activeOrganizations: totalTenantsCount > 0
      ? parseFloat(((activeTenantsCount * 100) / totalTenantsCount).toFixed(2))
      : 0,
    inactiveOrganizations: totalTenantsCount > 0
      ? parseFloat(((inactiveTenantsCount * 100) / totalTenantsCount).toFixed(2))
      : 0,
  };

  const stats = {
    allOrganizations: {
      count: totalTenantsCount,
      growth: growth.allOrganizations,
      icon: <Building2 className="text-white size-5" />,
    },
    activeOrganizations: {
      count: activeTenantsCount,
      growth: growth.activeOrganizations,
      icon: <UserRoundPlus className="text-white size-5" />,
    },
    inactiveOrganizations: {
      count: inactiveTenantsCount,
      growth: growth.inactiveOrganizations,
      icon: <UserRound className="text-white size-5" />,
    },
  };

  return (
    <div className="min-h-screen w-full  mb-10">
      <main className="container mx-auto  py-6 px-[30px]">
        <div className="flex flex-col items-center md:items-start gap-1 py-2">
          <div className="flex md:flex-col items-center md:items-start gap-1">
            <h1 className="text-[18px] md:text-[20px] font-medium text-[#595959]">
              Welcome,
            </h1>
            <h2 className="text-[20px] md:text-[24px] font-bold text-[#003465]">
              {user?.first_name} {user?.last_name}
            </h2>
          </div>
          <span className="text-[#737373] text-[12px]">
            Here are your important tasks, updates and alerts.
          </span>
        </div>

        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <SkeletonBox className="h-[250px] w-full" />
            <SkeletonBox className="h-[250px] w-full" />
            <SkeletonBox className="h-[250px] w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="All Organizations"
              value={stats.allOrganizations.count}
              growth={stats.allOrganizations.growth}
              color="blue"
              icon={stats.allOrganizations.icon}
              href="/dashboard/organization"
            />
            <StatCard
              title="Active Organizations"
              value={stats.activeOrganizations.count}
              growth={stats.activeOrganizations.growth}
              color="green"
              icon={stats.activeOrganizations.icon}
              href="/dashboard/organization/active"
            />
            <StatCard
              title="Inactive Organizations"
              value={stats.inactiveOrganizations.count}
              growth={stats.inactiveOrganizations.growth}
              color="yellow"
              icon={stats.inactiveOrganizations.icon}
              href="/dashboard/organization/inactive"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col space-y-4">
            {loadingAppointments ? (
              <SkeletonBox className="h-[300px] w-full" />
            ) : appointmentsChartData && !Array.isArray(appointmentsChartData) && appointmentsChartData.appointmentsByDay && appointmentsChartData.appointmentsByDay.length > 0 ? (
              <AppointmentsChart data={appointmentsChartData} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 h-[300px] w-full flex items-center justify-center">
                No appointments data available
              </div>
            )}

            {loadingPatients ? (
              <SkeletonBox className="h-[300px] w-full" />
            ) : patientsDonutData && !Array.isArray(patientsDonutData) && patientsDonutData.ageDistribution && patientsDonutData.ageDistribution.length > 0 ? (
              <PatientsDonut data={patientsDonutData} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 h-[300px] w-full flex items-center justify-center">
                No patients data available
              </div>
            )}
          </div>
          {loadingEmployees ? (
            <SkeletonBox className="h-[300px] w-full" />
          ) : Array.isArray(employeesData) && employeesData.length > 0 && typeof employeesData[0] === 'object' ? (
            <EmployeeSection
              employees={
                (employeesData as unknown[])
                  .filter((u): u is User =>
                    typeof u === 'object' &&
                    u !== null &&
                    'id' in u &&
                    'firstname' in u &&
                    'lastname' in u
                  )
                  .map((user: any) => ({
                    id: user.id,
                    name: `${user.firstname} ${user.lastname}`.trim(),
                    role: user.roles && user.roles.length > 0 ? user.roles[0].name : "Employee",
                    organization: hasTenant(user) && user.tenant && 'name' in user.tenant ? user.tenant.name || "-" : "-",
                    description: user.about || "",
                    image: user.image_url || "/assets/images/employeeprofile.png",
                    orgId: user.tenant?.id || 0,
                  }))
              }
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 h-[300px] w-full flex items-center justify-center">No employees data available</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loadingTenants ? (
            <SkeletonBox className="h-[300px] w-full" />
          ) : errorTenants && (!organizations || organizations.length === 0) ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-red-600 h-[300px] w-full flex items-center justify-center">Failed to load organizations</div>
          ) : organizations.length > 0 ? (
            <OrganizationList organizations={organizations} />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 h-[300px] w-full flex items-center justify-center">No organizations available</div>
          )}
          {loadingOrgStatus ? (
            <SkeletonBox className="h-[300px] w-full" />
          ) : errorOrgStatus && !isSyntaxError(errorOrgStatus) ? (
            // Only show error message for non-syntax errors
            <div className="bg-white p-6 rounded-lg shadow-md text-red-600 h-[300px] w-full flex items-center justify-center">
              Failed to load organization stats
            </div>
          ) : (
            // Always show stats with fallback data (handles syntax errors gracefully)
            <OrganizationStatus data={organizationStats} colors={colors} />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
