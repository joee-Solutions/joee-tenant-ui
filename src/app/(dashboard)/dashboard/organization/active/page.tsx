"use client";

import { AllOrgTableData } from "@/components/shared/table/data";
import StatCard from "@/components/dashboard/StatCard";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";

import DataTable from "@/components/shared/table/DataTable";
import DataTableFilter, {
  ListView,
} from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Plus, Building2, UserRoundPlus, MoreVertical, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { formatDateFn } from "@/lib/utils";
import { useTenantsData, authFectcher, useAdminProfile } from "@/hooks/swr";
import { Tenant } from "@/lib/types";
import NewOrg from "../NewOrg";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR, { useSWRConfig } from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { extractData } from "@/framework/joee.client";
import { toast } from "react-toastify";
import DeleteWarningModal from "@/components/shared/modals/DeleteWarningModal";
import OrganizationSuccessModal from "@/components/shared/modals/OrganizationSuccessModal";
import { sortByCreatedAtAsc } from "@/utils/sortByCreatedAt";
import EditOrganizationModal from "@/components/Org/Organizations/EditOrganizationModal";
import {
  normalizeTenantsArray,
  resolveTenantStatCount,
} from "@/utils/tenantStats";
import {
  isDeleteMutationSuccess,
  runAuthMutation,
} from "@/framework/mutation-request";
import { resolveOrgDeleteErrorMessage } from "@/framework/api-errors";

function resolveOrgLogoSrc(logo: unknown): string | typeof orgPlaceholder {
  if (typeof logo !== "string") return orgPlaceholder;
  const value = logo.trim();
  if (!value) return orgPlaceholder;

  // Accept data URLs and app-relative asset paths.
  if (value.startsWith("data:image/") || value.startsWith("/")) return value;

  // Accept only valid absolute http(s) URLs.
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return value;
    }
  } catch {
    // Fall back to placeholder for malformed URL values.
  }

  return orgPlaceholder;
}

function PageContent() {
  const searchParams = useSearchParams();
  const { mutate: globalMutate } = useSWRConfig();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [status, setStatus] = useState("Active"); // Default to Active for this page
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const [deletedOrgName, setDeletedOrgName] = useState("");

  // Admin can edit, but only Super Admin can delete
  const { data: adminProfile } = useAdminProfile();
  const roles: string[] = Array.isArray(adminProfile)
    ? adminProfile[0]?.roles ?? []
    : (adminProfile as any)?.roles ?? [];
  const isSuperAdmin = roles.includes("Super_Admin");

  // Map sortBy to backend fields
  const sortFieldMap: Record<string, string> = {
    Name: "name",
    Date: "createdAt",
    Location: "domain",
    Status: "status",
  };
  const mappedSort = sortBy && sortFieldMap[sortBy] ? `${sortFieldMap[sortBy]}:asc` : "createdAt:asc";
  
  // Fetch all tenants (without status filter - we'll filter on frontend)
  const { data: allTenantsData, meta, isLoading: tenantsLoading, error: tenantsError } = useTenantsData({
    search,
    sort: mappedSort,
    page,
    limit: pageSize,
  });

  // Filter organizations by status on the frontend, oldest created first
  const tenantsData = useMemo(() => {
    if (!Array.isArray(allTenantsData)) return [];

    let filtered: typeof allTenantsData;
    if (!status || status === "all" || status === "") {
      filtered = allTenantsData;
    } else {
      const statusLower = status.toLowerCase();
      filtered = allTenantsData.filter((org: any) => {
        const statusFromField = (org?.status ?? "").toString().toLowerCase().trim();
        const statusFromIsActive =
          typeof org?.is_active === "boolean"
            ? org.is_active
              ? "active"
              : "inactive"
            : "";
        const normalizedOrgStatus = statusFromField || statusFromIsActive || "";
        const normalized =
          normalizedOrgStatus === "deactivated" ? "inactive" : normalizedOrgStatus;

        if (statusLower === "inactive") return normalized === "inactive";
        if (statusLower === "active") return normalized === "active";
        return normalized === statusLower;
      });
    }

    return sortByCreatedAtAsc(filtered);
  }, [allTenantsData, status]);

  // Read search query from URL params
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  const prevFilters = useRef({ search, sortBy, status, pageSize });
  useEffect(() => {
    if (
      prevFilters.current.search !== search ||
      prevFilters.current.sortBy !== sortBy ||
      prevFilters.current.status !== status ||
      prevFilters.current.pageSize !== pageSize
    ) {
      setPage(1);
    }
    prevFilters.current = { search, sortBy, status, pageSize };
  }, [search, sortBy, status, pageSize]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [openDropdownId]);

  const handleEditClick = (org: any) => {
    setSelectedOrg(org);
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteClick = (org: any) => {
    if (!isSuperAdmin) {
      toast.info("Only Super Admin can delete organizations.");
      return;
    }
    setSelectedOrg(org);
    setDeleteModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleEditSuccess = () => {
    // Revalidate to refresh data
    globalMutate(
      (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.GET_ALL_TENANTS)
    );
    setEditModalOpen(false);
    setSelectedOrg(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrg) return;

    if (!isSuperAdmin) {
      toast.info("Only Super Admin can delete organizations.");
      setDeleteModalOpen(false);
      setSelectedOrg(null);
      return;
    }
    
    setUpdatingId(selectedOrg.id);
    try {
      const { response, error } = await runAuthMutation(
        "delete",
        API_ENDPOINTS.EDIT_ORGANIZATION(String(selectedOrg.id))
      );

      if (!isDeleteMutationSuccess(response, error)) {
        toast.error(resolveOrgDeleteErrorMessage(error ?? response));
        return;
      }

      const removedName = selectedOrg.name || "Organization";
      toast.success("Organization deleted successfully");
      setDeleteModalOpen(false);
      setSelectedOrg(null);
      setDeletedOrgName(removedName);
      setDeleteSuccessOpen(true);
      globalMutate(
        (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.GET_ALL_TENANTS)
      );
    } catch (error) {
      console.error(error);
      toast.error(resolveOrgDeleteErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  // Fetch full lists for accurate counts (API default page size is often 10)
  const { data: allTenantsStatsData, isLoading: loadingAllTenants } = useSWR(
    `${API_ENDPOINTS.GET_ALL_TENANTS}?limit=1000`,
    authFectcher,
    { revalidateOnFocus: false }
  );
  
  const { data: activeTenantsStatsData, isLoading: loadingActiveTenants } = useSWR(
    `${API_ENDPOINTS.GET_ALL_TENANTS_ACTIVE}?limit=1000`,
    authFectcher,
    { revalidateOnFocus: false }
  );
  
  const { data: inactiveTenantsStatsData, isLoading: loadingInactiveTenants } = useSWR(
    `${API_ENDPOINTS.GET_ALL_TENANTS_INACTIVE}?limit=1000`,
    authFectcher,
    { revalidateOnFocus: false }
  );

  // Extract and count tenants from each endpoint
  const allTenantsRaw: any = extractData<Tenant | Tenant[]>(allTenantsStatsData);
  const activeTenantsRaw: any = extractData<Tenant | Tenant[]>(activeTenantsStatsData);
  const inactiveTenantsRaw: any = extractData<Tenant | Tenant[]>(inactiveTenantsStatsData);

  const allTenants = normalizeTenantsArray(allTenantsRaw);
  const activeTenants = normalizeTenantsArray(activeTenantsRaw);
  const inactiveTenants = normalizeTenantsArray(inactiveTenantsRaw);
  
  const totalTenantsCount = resolveTenantStatCount(allTenantsStatsData, allTenants);
  const activeTenantsCount = resolveTenantStatCount(
    activeTenantsStatsData,
    activeTenants
  );
  const inactiveTenantsCount = resolveTenantStatCount(
    inactiveTenantsStatsData,
    inactiveTenants
  );
  
  const isLoadingStats = loadingAllTenants || loadingActiveTenants || loadingInactiveTenants;
  
  // Calculate growth percentages
  const growth = {
    allOrganizations: null,
    activeOrganizations: totalTenantsCount > 0
      ? parseFloat(((activeTenantsCount * 100) / totalTenantsCount).toFixed(2))
      : null,
    inactiveOrganizations: totalTenantsCount > 0
      ? parseFloat(((inactiveTenantsCount * 100) / totalTenantsCount).toFixed(2))
      : null,
  };

  // Map stat card data - All and Active (2 cards with API data)
  const statsCards = [
    {
      key: "totalTenants" as const,
      title: "All Organizations",
      value: totalTenantsCount,
      growth: growth.allOrganizations,
      color: "blue" as const,
      icon: <Building2 className="text-white size-5" />,
      href: "/dashboard/organization",
    },
    {
      key: "activeTenants" as const,
      title: "Active Organizations",
      value: activeTenantsCount,
      growth: growth.activeOrganizations,
      color: "green" as const,
      icon: <UserRoundPlus className="text-white size-5" />,
      href: "/dashboard/organization/active",
    },
  ];

  return (
    <section className="px-[30px] mb-10">
      {isAddOrg === "add" ? (
        <NewOrg setIsAddOrg={setIsAddOrg} />
      ) : (
        <>
      <header className="flex items-center gap-6 justify-between flex-wrap mb-[50px]">
        <h2 className="text-2xl text-black font-normal">Active Organizations</h2>

            <Button
              onClick={() => setIsAddOrg("add")}
              className="font-normal text-base text-white bg-[#003465] w-[306px] h-[60px]"
            >
          Create Organization <Plus size={24} />
        </Button>
      </header>

          {/* Stat Cards - All and Active (2 cards with API data) */}
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-[48px]">
                <SkeletonBox className="h-[300px] w-full" />
                <SkeletonBox className="h-[300px] w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-[48px]">
              {statsCards.map((stat) => (
                  <StatCard
                  key={stat.key}
                    title={stat.title}
                    value={stat.value}
                    growth={stat.growth}
                    color={stat.color}
                    icon={stat.icon}
                  href={stat.href}
                  />
        ))}
      </div>
          )}

      <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
            <header className="flex items-center justify-between gap-5 py-2">
          <h2 className="font-semibold text-xl text-black">
            Active Organization List
          </h2>
          <ListView pageSize={pageSize} setPageSize={setPageSize} />
        </header>
        <DataTableFilter
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
          status={status}
          setStatus={setStatus}
          statusOptions={["Active"]}
        />
        <DataTable tableDataObj={AllOrgTableData[0]} showAction>
              {tenantsLoading ? (
                // Loading skeleton for table rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="px-3 relative">
                    <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                    <TableCell className="py-[21px]">
                      <div className="flex items-center gap-[10px]">
                        <SkeletonBox className="w-[42px] h-[42px] rounded-full" />
                        <SkeletonBox className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                    <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                    <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                    <TableCell><SkeletonBox className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : tenantsError && (!tenantsData || (Array.isArray(tenantsData) && tenantsData.length === 0)) ? (
            <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-red-600 font-medium">Failed to load organizations</p>
                      <p className="text-gray-500 text-sm">
                        {tenantsError?.message || "Please try again or refresh the page"}
                      </p>
                    </div>
              </TableCell>
            </TableRow>
              ) : Array.isArray(tenantsData) && tenantsData.length > 0 ? (
                tenantsData.map((data: any, index: number) => (
                  <TableRow key={data.id} className="px-3 relative">
                    <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                <TableCell className="py-[21px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="w-[42px] h-[42px] rounded-full overflow-hidden">
                      <Image
                            src={
                              resolveOrgLogoSrc(data?.logo)
                            }
                        alt="organization image"
                        width={42}
                        height={42}
                        className="object-cover aspect-square w-full h-full"
                      />
                    </span>
                    <Link href={`/dashboard/organization/${data.id}`}>
                      <p className="font-medium text-xs text-black hover:underline">
                          {data?.name}
                      </p>
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                      {formatDateFn(data?.created_at || data?.createdAt)}
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                      {data?.address}{" "}
                </TableCell>
                <TableCell
                  className={`font-semibold text-xs ${
                        data?.status?.toLowerCase() === "active"
                      ? "text-[#3FA907]"
                          : data?.status?.toLowerCase() === "inactive"
                          ? "text-[#EC0909]"
                          : data?.status?.toLowerCase() === "deactivated"
                          ? "text-[#999999]"
                          : "text-[#737373]"
                      }`}
                    >
                      {data?.status?.toUpperCase() || "N/A"}
                </TableCell>
                <TableCell>
                      <div className="relative">
                        <button
                          className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-gray-100 rounded flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === data.id ? null : data.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdownId === data.id && (
                          <div 
                            className={`absolute right-0 z-50 min-w-[120px] overflow-hidden rounded-md border bg-white p-1 shadow-md ${
                              index >= tenantsData.length - 2 || tenantsData.length === 1 ? 'bottom-10' : 'top-10'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleEditClick(data);
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </div>
                            {isSuperAdmin && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  handleDeleteClick(data);
                                }}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
              </TableRow>
            ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No active organizations found
                  </TableCell>
                </TableRow>
          )}
        </DataTable>
        <Pagination
              dataLength={meta?.total || tenantsData?.length || 0}
              numOfPages={meta?.total ? Math.ceil(meta.total / pageSize) : Math.ceil((tenantsData?.length || 0) / pageSize)}
          pageSize={pageSize}
              currentPage={page}
              setCurrentPage={setPage}
        />
      </section>

          {/* Edit Organization Modal */}
          {editModalOpen && selectedOrg && (
            <EditOrganizationModal
              key={selectedOrg.id}
              organization={selectedOrg}
              onClose={() => {
                setEditModalOpen(false);
                setSelectedOrg(null);
              }}
              onSuccess={handleEditSuccess}
            />
          )}

          {/* Delete Warning Modal */}
          {deleteModalOpen && selectedOrg && (
            <DeleteWarningModal
              title="Delete Organization"
              message="Are you sure you want to delete"
              itemName={selectedOrg?.name}
              onConfirm={handleDeleteConfirm}
              onCancel={() => {
                setDeleteModalOpen(false);
                setSelectedOrg(null);
              }}
              isDeleting={updatingId === selectedOrg?.id}
            />
          )}

          <OrganizationSuccessModal
            open={deleteSuccessOpen}
            onOpenChange={setDeleteSuccessOpen}
            description={
              deletedOrgName
                ? `"${deletedOrgName}" has been deleted successfully.`
                : "Organization has been deleted successfully."
            }
          />
        </>
      )}
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <section className="px-[30px] mb-10">
        <div className="flex items-center gap-6 justify-between flex-wrap mb-[50px]">
          <h2 className="text-2xl text-black font-normal">Active Organizations</h2>
          <SkeletonBox className="h-[60px] w-[306px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-[48px]">
          <SkeletonBox className="h-[300px] w-full" />
          <SkeletonBox className="h-[300px] w-full" />
        </div>
      </section>
    }>
      <PageContent />
    </Suspense>
  );
}
