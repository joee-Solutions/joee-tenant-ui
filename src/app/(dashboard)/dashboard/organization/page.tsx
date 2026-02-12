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
import { Plus, Building2, UserRoundPlus, UserRound, UserRoundX, MoreVertical, Edit, Trash2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import NewOrg from "./NewOrg";
import OrgManagement from "./OrgManagement";
import Link from "next/link";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { formatDateFn } from "@/lib/utils";
import { useTenantsData } from "@/hooks/swr";
import { useSWRConfig } from "swr";
import { Tenant } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import useSWR from "swr";
import { authFectcher } from "@/hooks/swr";
import { extractData } from "@/framework/joee.client";
import { toast } from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditOrganizationModal from "@/components/Org/Organizations/EditOrganizationModal";
import DeleteWarningModal from "@/components/shared/modals/DeleteWarningModal";

function PageContent() {
  const searchParams = useSearchParams();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [status, setStatus] = useState("");
  const [isAddOrg, setIsAddOrg] = useState<"add" | "none" | "edit">("none");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [localTenants, setLocalTenants] = useState<any[] | null>(null);

  // Read search query from URL params
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  // Fetch stat card data from separate endpoints (same as dashboard page)
  const { data: statsAllTenantsData, isLoading: loadingAllTenants } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS,
    authFectcher,
    { revalidateOnFocus: false }
  );
  
  const { data: statsActiveTenantsData, isLoading: loadingActiveTenants } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS_ACTIVE,
    authFectcher,
    { revalidateOnFocus: false }
  );
  
  const { data: statsInactiveTenantsData, isLoading: loadingInactiveTenants } = useSWR(
    API_ENDPOINTS.GET_ALL_TENANTS_INACTIVE,
    authFectcher,
    { revalidateOnFocus: false }
  );

  // Extract and count tenants from each endpoint
  const allTenantsRaw: any = extractData<Tenant | Tenant[]>(statsAllTenantsData);
  const activeTenantsRaw: any = extractData<Tenant | Tenant[]>(statsActiveTenantsData);
  const inactiveTenantsRaw: any = extractData<Tenant | Tenant[]>(statsInactiveTenantsData);
  
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
  
  const dashboardLoading = loadingAllTenants || loadingActiveTenants || loadingInactiveTenants;
  
  const { mutate: globalMutate } = useSWRConfig();
  // Map sortBy to backend fields
  const sortFieldMap: Record<string, string> = {
    Name: "name",
    Date: "createdAt",
    Location: "domain",
    Status: "status",
  };
  const mappedSort = sortBy && sortFieldMap[sortBy] ? `${sortFieldMap[sortBy]}:asc` : undefined;
  // Fetch all tenants (without status filter - we'll filter on frontend)
  const { data: allTenantsData, meta, isLoading: tenantsLoading, error: tenantsError } = useTenantsData({
    search,
    sort: mappedSort,
    // Don't pass status to API - filter on frontend instead
    page,
    limit: pageSize,
  });

  // Filter organizations by status on the frontend
  const tenantsData = useMemo(() => {
    if (!Array.isArray(allTenantsData)) return [];
    
    if (!status) {
      // No filter - return all
      return allTenantsData;
    }
    
    // Filter by status (case-insensitive)
    // Check if organization status matches the selected filter
    const statusLower = status.toLowerCase();
    return allTenantsData.filter((org: any) => {
      const orgStatus = org?.status?.toLowerCase() || '';
      return orgStatus === statusLower;
    });
  }, [allTenantsData, status]);

  // Keep a local copy we can update after edits without forcing a full reload
  useEffect(() => {
    if (Array.isArray(tenantsData)) {
      setLocalTenants(tenantsData);
    }
  }, [tenantsData]);

  // Keep organizations ordered by creation date so edited items don't jump to the end
  const sortedTenantsData = useMemo(() => {
    const source = localTenants ?? tenantsData;
    if (!Array.isArray(source)) return [];
    return [...source].sort((a: any, b: any) => {
      const aDate = new Date(a?.created_at || a?.createdAt || "").getTime();
      const bDate = new Date(b?.created_at || b?.createdAt || "").getTime();
      return aDate - bDate;
    });
  }, [localTenants, tenantsData]);

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

  const handleEditClick = (org: any) => {
    setSelectedOrg(org);
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteClick = (org: any) => {
    setSelectedOrg(org);
    setDeleteModalOpen(true);
    setOpenDropdownId(null);
  };

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

  const handleEditSuccess = () => {
      // Optimistically update local list so the table reflects changes without reload
      setLocalTenants((prev) =>
        Array.isArray(prev)
          ? prev.map((org) =>
            org.id === selectedOrg?.id
              ? { ...org, ...selectedOrg }
                : org
            )
          : prev
      );
    
    // Revalidate to refresh data
    globalMutate(
      (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.GET_ALL_TENANTS)
    );

      setEditModalOpen(false);
      setSelectedOrg(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrg) return;
    
    setUpdatingId(selectedOrg.id);
    try {
      await processRequestAuth(
        "delete",
        API_ENDPOINTS.EDIT_ORGANIZATION(String(selectedOrg.id))
      );
      toast.success("Organization deleted successfully");
      
      // Calculate if we need to adjust pagination
      // Check if current page will be empty after deletion
      const currentPageItemCount = sortedTenantsData?.length || 0;
      const willPageBeEmpty = currentPageItemCount === 1; // Only the item being deleted
      const shouldGoToPreviousPage = willPageBeEmpty && page > 1;
      
      // Optimistically update local list to remove deleted organization
      setLocalTenants((prev) =>
        Array.isArray(prev)
          ? prev.filter((org) => org.id !== selectedOrg.id)
          : prev
      );
      
      // Also update the main tenantsData by mutating SWR cache
      // This updates both the data array and the meta (total count)
      globalMutate(
        (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.GET_ALL_TENANTS),
        (currentData: any) => {
          if (!currentData) return currentData;
          
          // Handle different response structures
          let data: any[] = [];
          let metaData: any = null;
          
          if (Array.isArray(currentData)) {
            data = currentData;
          } else if (currentData?.data) {
            data = currentData.data;
            metaData = currentData.meta;
          } else if (currentData?.results) {
            data = currentData.results;
            metaData = currentData.meta;
          }
          
          // Filter out deleted organization
          const filtered = data.filter((org: any) => org.id !== selectedOrg.id);
          
          // Update meta total count
          if (metaData && typeof metaData.total === 'number') {
            metaData = {
              ...metaData,
              total: Math.max(0, metaData.total - 1),
            };
          }
          
          // Return updated structure
          if (Array.isArray(currentData)) {
            return filtered;
          } else if (currentData?.data) {
            return { ...currentData, data: filtered, meta: metaData || currentData.meta };
          } else if (currentData?.results) {
            return { ...currentData, results: filtered, meta: metaData || currentData.meta };
          }
          return filtered;
        },
        false
      );
      
      // Adjust pagination if needed - go to previous page if current page becomes empty
      if (shouldGoToPreviousPage) {
        setPage(page - 1);
      }
      
      setDeleteModalOpen(false);
      setSelectedOrg(null);
      
      // Revalidate to ensure we have the latest data from server
      // This ensures pagination and other pages are updated correctly
      setTimeout(() => {
        // Revalidate all matching keys to get fresh data from server
        globalMutate(
          (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.GET_ALL_TENANTS)
        );
      }, 100);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete organization");
    } finally {
      setUpdatingId(null);
    }
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

  // Map to StatCard format (same APIs as dashboard page)
  const statsCards = [
    {
      key: "totalTenants" as const,
      title: "All Organizations",
      value: totalTenantsCount,
      growth: growth.allOrganizations,
      color: "blue" as const,
      icon: <Building2 className="text-white size-5" />,
    },
    {
      key: "activeTenants" as const,
      title: "Active Organizations",
      value: activeTenantsCount,
      growth: growth.activeOrganizations,
      color: "green" as const,
      icon: <UserRoundPlus className="text-white size-5" />,
    },
    {
      key: "inactiveTenants" as const,
      title: "Inactive Organizations",
      value: inactiveTenantsCount,
      growth: growth.inactiveOrganizations,
      color: "yellow" as const,
      icon: <UserRound className="text-white size-5" />,
    },
  ];


  return (
    <section className="px-[30px] mb-10">
      {isAddOrg === "add" ? (
        <NewOrg setIsAddOrg={setIsAddOrg} />
      ) : isAddOrg === "edit" ? (
        <OrgManagement setIsAddOrg={setIsAddOrg} />
      ) : (
        <>
          <header className="flex items-center gap-6 justify-between flex-wrap mb-[50px]">
            <h2 className="text-2xl text-black font-normal">Organizations</h2>

            <Button
              onClick={() => setIsAddOrg("add")}
              className="font-normal text-base text-white bg-[#003465] w-[306px] h-[60px]"
            >
              Create Organization <Plus size={24} />
            </Button>
          </header>

          {dashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <SkeletonBox className="h-[300px] w-full" />
              <SkeletonBox className="h-[300px] w-full" />
              <SkeletonBox className="h-[300px] w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-[48px]">
              {statsCards.map((stat) => (
                <StatCard
                  key={stat.key}
                  title={stat.title}
                  value={stat.value}
                  growth={stat.growth}
                  color={stat.color}
                  icon={stat.icon}
                  href={
                    stat.key === "totalTenants" ? "/dashboard/organization" :
                    stat.key === "activeTenants" ? "/dashboard/organization/active" :
                    stat.key === "inactiveTenants" ? "/dashboard/organization/inactive" :
                    undefined
                  }
                />
              ))}
            </div>
          )}
          <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
            <header className="flex items-center justify-between gap-5">
              <h2 className="font-semibold text-xl text-black">
                Organization List
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
              ) : tenantsError && (!allTenantsData || (Array.isArray(allTenantsData) && allTenantsData.length === 0)) ? (
                // Show error message only if we don't have any data (including cached data)
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
              ) : Array.isArray(sortedTenantsData) && sortedTenantsData.length > 0 ? (
                sortedTenantsData.map((data: any, index: number) => (
                  <TableRow key={data.id} className="px-3 relative">
                    <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="py-[21px] ">
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden">
                          <Image
                            src={
                              data?.logo ||
                              orgPlaceholder
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
                          : "text-[#EC0909]"
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
                              // Show above if it's the last item, last 2 items, or if there's only 1 item
                              index >= sortedTenantsData.length - 2 || sortedTenantsData.length === 1 ? 'bottom-10' : 'top-10'
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
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {status 
                      ? `No ${status.toLowerCase()} organizations found` 
                      : "No organizations found"}
                  </TableCell>
                </TableRow>
              )}
            </DataTable>
            <Pagination
              dataLength={meta?.total || tenantsData?.length || 0}
              numOfPages={meta?.total ? Math.ceil(meta.total / pageSize) : 1}
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

          {/* Delete Confirmation Modal */}
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
          <h2 className="text-2xl text-black font-normal">Organizations</h2>
          <SkeletonBox className="h-[60px] w-[306px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <SkeletonBox className="h-[300px] w-full" />
          <SkeletonBox className="h-[300px] w-full" />
          <SkeletonBox className="h-[300px] w-full" />
          <SkeletonBox className="h-[300px] w-full" />
        </div>
      </section>
    }>
      <PageContent />
    </Suspense>
  );
}
