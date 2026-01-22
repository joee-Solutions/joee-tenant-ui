"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTenantsData, useAllUsersData, useAllPatientsData } from "@/hooks/swr";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { Building2, Users, UserCircle, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get("q") || "";
  const [activeTab, setActiveTab] = useState<"all" | "organizations" | "employees" | "patients">("all");

  // Fetch all data
  const { data: tenantsData, isLoading: loadingTenants } = useTenantsData({ search: query });
  const { data: employeesData, isLoading: loadingEmployees } = useAllUsersData();
  const { data: patientsData, isLoading: loadingPatients } = useAllPatientsData();

  // Filter data based on search query
  const filteredOrganizations = useMemo(() => {
    if (!query || !Array.isArray(tenantsData)) return [];
    const searchLower = query.toLowerCase();
    return tenantsData.filter((org: any) => 
      org.name?.toLowerCase().includes(searchLower) ||
      org.domain?.toLowerCase().includes(searchLower) ||
      org.email?.toLowerCase().includes(searchLower)
    );
  }, [tenantsData, query]);

  const filteredEmployees = useMemo(() => {
    if (!query || !Array.isArray(employeesData)) return [];
    const searchLower = query.toLowerCase();
    return employeesData.filter((emp: any) => 
      `${emp.firstname || ''} ${emp.lastname || ''}`.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.designation?.toLowerCase().includes(searchLower) ||
      emp.department?.name?.toLowerCase().includes(searchLower)
    );
  }, [employeesData, query]);

  const filteredPatients = useMemo(() => {
    if (!query || !Array.isArray(patientsData)) return [];
    const searchLower = query.toLowerCase();
    return patientsData.filter((patient: any) => 
      `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone_number?.toLowerCase().includes(searchLower)
    );
  }, [patientsData, query]);

  const totalResults = filteredOrganizations.length + filteredEmployees.length + filteredPatients.length;

  const displayData = useMemo(() => {
    if (activeTab === "organizations") return { organizations: filteredOrganizations };
    if (activeTab === "employees") return { employees: filteredEmployees };
    if (activeTab === "patients") return { patients: filteredPatients };
    return {
      organizations: filteredOrganizations,
      employees: filteredEmployees,
      patients: filteredPatients,
    };
  }, [activeTab, filteredOrganizations, filteredEmployees, filteredPatients]);

  if (!query) {
    return (
      <div className="min-h-screen w-full mb-10">
        <main className="container mx-auto py-6 px-[30px]">
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <h2 className="text-2xl font-semibold text-gray-600">Enter a search query</h2>
            <p className="text-gray-500">Please enter a search term to find organizations, employees, patients, and more.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full mb-10">
      <main className="container mx-auto py-6 px-[30px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#003465] mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} across all entities
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium ${
              activeTab === "all"
                ? "border-b-2 border-[#003465] text-[#003465]"
                : "text-gray-600 hover:text-[#003465]"
            }`}
          >
            All ({totalResults})
          </button>
          <button
            onClick={() => setActiveTab("organizations")}
            className={`px-4 py-2 font-medium ${
              activeTab === "organizations"
                ? "border-b-2 border-[#003465] text-[#003465]"
                : "text-gray-600 hover:text-[#003465]"
            }`}
          >
            Organizations ({filteredOrganizations.length})
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2 font-medium ${
              activeTab === "employees"
                ? "border-b-2 border-[#003465] text-[#003465]"
                : "text-gray-600 hover:text-[#003465]"
            }`}
          >
            Employees ({filteredEmployees.length})
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-4 py-2 font-medium ${
              activeTab === "patients"
                ? "border-b-2 border-[#003465] text-[#003465]"
                : "text-gray-600 hover:text-[#003465]"
            }`}
          >
            Patients ({filteredPatients.length})
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Organizations */}
          {(activeTab === "all" || activeTab === "organizations") && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-[#003465]" />
                <h2 className="text-xl font-semibold">Organizations</h2>
                <span className="text-gray-500">({filteredOrganizations.length})</span>
              </div>
              {loadingTenants ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonBox key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredOrganizations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrganizations.map((org: any) => (
                    <Link
                      key={org.id}
                      href={`/dashboard/organization/${org.id}`}
                      className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={org.logo || "/assets/images/profilepic.png"}
                          alt={org.name}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold text-[#003465]">{org.name}</h3>
                          <p className="text-sm text-gray-500">{org.domain || org.email || "-"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-4">No organizations found</p>
              )}
            </div>
          )}

          {/* Employees */}
          {(activeTab === "all" || activeTab === "employees") && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#003465]" />
                <h2 className="text-xl font-semibold">Employees</h2>
                <span className="text-gray-500">({filteredEmployees.length})</span>
              </div>
              {loadingEmployees ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonBox key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmployees.map((emp: any) => (
                    <Link
                      key={emp.id}
                      href={emp.tenant?.id ? `/dashboard/organization/${emp.tenant.id}/employees` : "#"}
                      className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={emp.image_url || "/assets/images/employeeprofile.png"}
                          alt={`${emp.firstname} ${emp.lastname}`}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold text-[#003465]">
                            {emp.firstname} {emp.lastname}
                          </h3>
                          <p className="text-sm text-gray-500">{emp.designation || emp.email || "-"}</p>
                          <p className="text-xs text-gray-400">{emp.tenant?.name || "-"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-4">No employees found</p>
              )}
            </div>
          )}

          {/* Patients */}
          {(activeTab === "all" || activeTab === "patients") && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UserCircle className="w-5 h-5 text-[#003465]" />
                <h2 className="text-xl font-semibold">Patients</h2>
                <span className="text-gray-500">({filteredPatients.length})</span>
              </div>
              {loadingPatients ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonBox key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatients.map((patient: any) => (
                    <Link
                      key={patient.id}
                      href={patient.tenant?.id ? `/dashboard/organization/${patient.tenant.id}/patients` : "#"}
                      className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#003465]">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{patient.email || patient.phone_number || "-"}</p>
                          <p className="text-xs text-gray-400">{patient.tenant?.name || "-"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-4">No patients found</p>
              )}
            </div>
          )}

          {totalResults === 0 && !loadingTenants && !loadingEmployees && !loadingPatients && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No results found for "{query}"</p>
              <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

