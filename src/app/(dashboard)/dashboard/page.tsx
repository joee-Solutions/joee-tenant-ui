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

const DashboardPage: NextPage = () => {
  const { data, isLoading, error } = useDashboardData();
  const { data: appointmentsData, isLoading: loadingAppointments, error: errorAppointments } = useDashboardAppointments();
  const { data: patientsData, isLoading: loadingPatients, error: errorPatients } = useDashboardPatients();
  const { data: employeesData, isLoading: loadingEmployees, error: errorEmployees } = useDashboardEmployees();
  const { data: tenantsData, isLoading: loadingTenants, error: errorTenants } = useTenantsData({ limit: 4 });
  const organizations = Array.isArray(tenantsData)
    ? tenantsData.filter((t): t is import("@/lib/types").Tenant => typeof t === 'object' && t !== null && 'id' in t && 'name' in t)
        .slice(0, 4)
        .map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          location: tenant.address || tenant.domain || "-",
          status:
            tenant.status === "ACTIVE"
              ? "Active"
              : tenant.status === "INACTIVE"
              ? "Inactive"
              : tenant.status === "DEACTIVATED"
              ? "Deactivated"
              : "Inactive",
          image: tenant.logo || "/assets/images/profilepic.png",
        }))
    : [];

  const { data: orgStatusData, isLoading: loadingOrgStatus, error: errorOrgStatus } = useSWR(
    "/organization/status",
    authFectcher
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
console.log(employeesData,'employeesData')
  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen w-full mb-10">
        <main className="container mx-auto py-6 px-[30px]">
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <h2 className="text-2xl font-semibold text-red-600">Failed to Load Dashboard</h2>
            <p className="text-gray-600">Please try refreshing the page or contact support.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </main>
      </div>
    );
  }

  const growth = {
    allOrganizations: null,
    activeOrganizations: parseFloat(
      (data?.activeTenants ? (data?.activeTenants * 100) / data?.totalTenants : 0).toFixed(2)
    ),
    inactiveOrganizations: parseFloat(
      (data?.inactiveTenants ? (data?.inactiveTenants * 100) / data?.totalTenants : 0).toFixed(2)
    ),
    deactivatedOrganizations: parseFloat(
      (data?.deactivatedTenants ? (data?.deactivatedTenants * 100) / data?.totalTenants : 0).toFixed(2)),
  };
  
  console.log("Growth Data:", growth);
  const stats = {
    allOrganizations: {
      count: data?.totalTenants || 0,
      growth: growth.allOrganizations,
      icon: <></>,
    },
    activeOrganizations: {
      count: data?.activeTenants || 0,
      growth: growth.activeOrganizations,
      icon: <></>,
    },
    inactiveOrganizations: {
      count: data?.inactiveTenants || 0,
      growth: growth.inactiveOrganizations,
      icon: <></>,
    },
    deactivatedOrganizations: {
      count: data?.deactivatedTenants || 0,
      growth: growth.deactivatedOrganizations,
      icon: <></>,
    },
    networkTab: { icon: <></> },
  };
  
  // Map backend data to AppointmentsChart expected props
  let appointmentsChartData: any = null;
  if (
    appointmentsData &&
    typeof appointmentsData === 'object' &&
    !Array.isArray(appointmentsData)
  ) {
    appointmentsChartData = {
      clinic: 'clinic' in appointmentsData && typeof appointmentsData.clinic === 'string' ? appointmentsData.clinic : '',
      weeklyGrowth: 'weeklyGrowth' in appointmentsData && typeof appointmentsData.weeklyGrowth === 'number' ? appointmentsData.weeklyGrowth : 0,
      appointmentsByDay: Array.isArray((appointmentsData as { appointmentsByDay?: unknown[] })?.appointmentsByDay)
        ? (appointmentsData as { appointmentsByDay: AppointmentsByDay[] }).appointmentsByDay
        : [],
    };
  }

  // Map backend data to PatientsDonut expected props
  let patientsDonutData: any = null;
  if (
    patientsData &&
    typeof patientsData === 'object' &&
    !Array.isArray(patientsData)
  ) {
    patientsDonutData = {
      totalPatients: typeof patientsData.totalPatients === 'number' ? patientsData.totalPatients : 0,
      ageDistribution: Array.isArray((patientsData as { ageDistribution?: unknown[] })?.ageDistribution)
        ? (patientsData as { ageDistribution: AgeGroup[] }).ageDistribution
        : [],
    };
  }

  return (
    <div className="min-h-screen w-full  mb-10">
      <main className="container mx-auto  py-6 px-[30px]">
        <div className="flex flex-col items-center md:items-start gap-1 py-2">
          <div className="flex md:flex-col items-center md:items-start gap-1">
            <h1 className="text-[18px] md:text-[20px] font-medium text-[#595959]">
              Welcome,
            </h1>
            <h2 className="text-[20px] md:text-[24px] font-bold text-[#003465]">
              Daniel James!
            </h2>
          </div>
          <span className="text-[#737373] text-[12px]">
            Here are your important tasks, updates and alerts.
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <SkeletonBox className="h-[250px] w-full" />
            <SkeletonBox className="h-[250px] w-full" />
            <SkeletonBox className="h-[250px] w-full" />
            <SkeletonBox className="h-[250px] w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="All Organizations"
              value={stats.allOrganizations.count}
              growth={stats.allOrganizations.growth}
              color="blue"
              icon={stats.allOrganizations.icon}
            />
            <StatCard
              title="Active Organizations"
              value={stats.activeOrganizations.count}
              growth={stats.activeOrganizations.growth}
              color="green"
              icon={stats.activeOrganizations.icon}
            />
            <StatCard
              title="Inactive Organizations"
              value={stats.inactiveOrganizations.count}
              growth={stats.inactiveOrganizations.growth}
              color="yellow"
              icon={stats.inactiveOrganizations.icon}
            />
            <StatCard
              title="Deactived Organizations"
              value={stats.deactivatedOrganizations.count}
              growth={stats.deactivatedOrganizations.growth}
              color="red"
              icon={stats.deactivatedOrganizations.icon}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col space-y-4">
            {loadingAppointments ? (
              <SkeletonBox className="h-[300px] w-full" />
            ) : errorAppointments ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-red-600 h-[300px] w-full flex items-center justify-center">Failed to load appointments data</div>
            ) : appointmentsChartData && appointmentsChartData.appointmentsByDay && appointmentsChartData.appointmentsByDay.length > 0 ? (
              <AppointmentsChart data={appointmentsChartData} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 h-[300px] w-full flex items-center justify-center">No appointments data available</div>
            )}

            {loadingPatients ? (
              <SkeletonBox className="h-[300px] w-full" />
            ) : errorPatients ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-red-600 h-[300px] w-full flex items-center justify-center">Failed to load patients data</div>
            ) : patientsDonutData && patientsDonutData.ageDistribution && patientsDonutData.ageDistribution.length > 0 ? (
              <PatientsDonut data={patientsDonutData} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 h-[300px] w-full flex items-center justify-center">No patients data available</div>
            )}
          </div>
          {loadingEmployees ? (
            <SkeletonBox className="h-[300px] w-full" />
          ) : errorEmployees ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-red-600 h-[300px] w-full flex items-center justify-center">Failed to load employees data</div>
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
                  .map((user:any) => ({
                    id: user.id,
                    name: `${user.firstname} ${user.lastname}`.trim(),
                    role: user.roles && user.roles.length > 0 ? user.roles[0].name : "Employee",
                    organization: hasTenant(user) && user.tenant && 'name' in user.tenant ? user.tenant.name || "-" : "-",
                    description: user.about || "",
                    image: user.image_url || "/assets/images/employeeprofile.png",
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
          ) : errorTenants ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-red-600 h-[300px] w-full flex items-center justify-center">Failed to load organizations</div>
          ) : organizations.length > 0 ? (
            <OrganizationList organizations={organizations} />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 h-[300px] w-full flex items-center justify-center">No organizations available</div>
          )}
          {loadingOrgStatus ? (
            <SkeletonBox className="h-[300px] w-full" />
          ) : errorOrgStatus ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-red-600 h-[300px] w-full flex items-center justify-center">Failed to load organization stats</div>
          ) : (
            <OrganizationStatus data={organizationStats} colors={colors} />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
