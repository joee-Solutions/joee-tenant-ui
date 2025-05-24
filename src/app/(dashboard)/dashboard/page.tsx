"use client";
import { NextPage } from "next";
// import Head from 'next/head';
import StatCard from "@/components/dashboard/StatCard";
import AppointmentsChart from "@/components/dashboard/AppointmentsChart";
import EmployeeSection from "@/components/dashboard/EmployeeSection";
import PatientsDonut from "@/components/dashboard/PatientsDonut";
import OrganizationList from "@/components/dashboard/OrganizationList";
import OrganizationStatus from "@/components/dashboard/OrganizationStatus";
import {
  appointmentsData,
  colors,
  employees,
  organizations,
  organizationStats,
  patientData,
} from "@/utils/dashboard";
import useSWR from "swr";
import { authFectcher } from "@/hooks/swr";
import { Spinner } from "@/components/icons/Spinner";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { API_ENDPOINTS } from "@/framework/api-endpoints";

// import { Organization, Employee, Patient } from '@/lib/types';

const DashboardPage: NextPage = () => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_DASHBOARD_DATA,
    authFectcher
  );

  console.log(data, isLoading, error);

  const growth = {
    allOrganizations: null,
    activeOrganizations: data?.active ? (data?.active * 100) / data?.total : 0,
    inactiveOrganizations: data?.inactive
      ? (data?.inactive * 100) / data?.total
      : 0,
    deactivatedOrganizations: data?.deactivated
      ? (data?.deactivated * 100) / data?.total
      : 0,
  };
  console.log("Growth Data:", growth);
  const stats = {
    allOrganizations: {
      count: data?.total || 0,
      growth: growth.allOrganizations,
      icon: <></>,
    },
    activeOrganizations: {
      count: data?.active || 0,
      growth: growth.activeOrganizations,
      icon: <></>,
    },
    inactiveOrganizations: {
      count: data?.inactive || 0,
      growth: growth.inactiveOrganizations,
      icon: <></>,
    },
    deactivatedOrganizations: {
      count: data?.deactivated || 0,
      growth: growth.deactivatedOrganizations,
      icon: <></>,
    },
    networkTab: { icon: <></> },
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
            <AppointmentsChart data={appointmentsData} />
            <PatientsDonut data={patientData} />
          </div>
          <EmployeeSection employees={employees} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrganizationList organizations={organizations} />
          <OrganizationStatus data={organizationStats} colors={colors} />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
