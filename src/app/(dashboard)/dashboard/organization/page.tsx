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
import { useDashboardData, useTenantsData } from "@/hooks/swr";
import { Tenant } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FieldBox from "@/components/shared/form/FieldBox";
import FieldSelect from "@/components/shared/form/FieldSelect";
import FormComposer from "@/components/shared/form/FormComposer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getChangedFields } from "@/lib/utils";

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [defaults, setDefaults] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [localTenants, setLocalTenants] = useState<any[] | null>(null);

  const EditOrganizationSchema = z.object({
    name: z.string().min(1, "This field is required"),
    status: z.string().min(1, "This field is required"),
    phoneNumber: z.string().optional(),
    organizationEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    address: z.string().optional(),
  });

  type EditOrganizationSchemaType = z.infer<typeof EditOrganizationSchema>;
  // Only Active / Inactive are supported – Deactivated has been removed
  const orgStatus = ["active", "inactive"];

  const form = useForm<EditOrganizationSchemaType>({
    resolver: zodResolver(EditOrganizationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      status: "",
      phoneNumber: "",
      organizationEmail: "",
      address: "",
    },
  });

  useEffect(() => {
    if (selectedOrg && editModalOpen) {
      const formData = {
        name: selectedOrg?.name || "",
        phoneNumber: selectedOrg?.phone_number || "",
        organizationEmail: selectedOrg?.email || "",
        status: selectedOrg?.status?.toLowerCase() || "inactive",
        address: selectedOrg?.address || "",
      };
      form.reset(formData);
      setDefaults(formData);
    }
  }, [selectedOrg, editModalOpen, form]);

  // Read search query from URL params
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  // Fetch dashboard stats
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardData();
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

  const handleEditSubmit = async (payload: EditOrganizationSchemaType) => {
    if (!selectedOrg) return;
    
    setUpdatingId(selectedOrg.id);
    try {
      const changedFields = getChangedFields(defaults, payload);
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        return;
      }

      const updatePayload: any = {};
      if (changedFields.name) updatePayload.name = changedFields.name;
      if (changedFields.status) {
        // Backend expects boolean is_active; also keep string status for compatibility
        updatePayload.status = changedFields.status.toUpperCase();
        updatePayload.is_active = changedFields.status.toLowerCase() === "active";
      }
      if (changedFields.phoneNumber) updatePayload.phone_number = changedFields.phoneNumber;
      if (changedFields.organizationEmail) updatePayload.email = changedFields.organizationEmail;
      if (changedFields.address) updatePayload.address = changedFields.address;

      await processRequestAuth(
        "put",
        API_ENDPOINTS.EDIT_ORGANIZATION(String(selectedOrg.id)),
        updatePayload
      );
      toast.success("Organization updated successfully");

      // Optimistically update local list so the table reflects changes without reload
      setLocalTenants((prev) =>
        Array.isArray(prev)
          ? prev.map((org) =>
              org.id === selectedOrg.id
                ? {
                    ...org,
                    ...updatePayload,
                    status: changedFields.status || org.status,
                  }
                : org
            )
          : prev
      );

      setEditModalOpen(false);
      setSelectedOrg(null);
      setDefaults(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organization");
    } finally {
      setUpdatingId(null);
    }
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
      setDeleteConfirmOpen(false);
      setDeleteModalOpen(false);
      setSelectedOrg(null);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete organization");
    } finally {
      setUpdatingId(null);
    }
  };

  // Map dashboard data to StatCard format
  const statsCards = [
    {
      key: "totalTenants" as const,
      title: "All Organizations",
      value: dashboardData?.totalTenants || 0,
      growth: null as number | null,
      color: "blue" as const,
      icon: <Building2 className="text-white size-5" />,
    },
    {
      key: "activeTenants" as const,
      title: "Active Organizations",
      value: dashboardData?.activeTenants || 0,
      growth: dashboardData?.totalTenants
        ? parseFloat(
            ((dashboardData.activeTenants * 100) / dashboardData.totalTenants).toFixed(2)
          )
        : null,
      color: "green" as const,
      icon: <UserRoundPlus className="text-white size-5" />,
    },
    {
      key: "inactiveTenants" as const,
      title: "Inactive Organizations",
      value: dashboardData?.inactiveTenants || 0,
      growth: dashboardData?.totalTenants
        ? parseFloat(
            ((dashboardData.inactiveTenants * 100) / dashboardData.totalTenants).toFixed(2)
          )
        : null,
      color: "yellow" as const,
      icon: <UserRound className="text-white size-5" />,
    },
  ];

  // Handle error states - only show error page for critical dashboard errors
  // For tenants data, empty results should show empty state in table, not error page
  if (dashboardError) {
    return (
      <section className="px-[30px] mb-10">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <h2 className="text-2xl font-semibold text-red-600">Failed to Load Organizations</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </section>
    );
  }

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
              ) : tenantsError ? (
                // Show error message
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
                            className="absolute right-0 top-10 z-50 min-w-[120px] overflow-hidden rounded-md border bg-white p-1 shadow-md"
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
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
              onClick={() => {
                setEditModalOpen(false);
                setSelectedOrg(null);
                setDefaults(null);
              }}
            >
              <div 
                className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-black">Edit Organization</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditModalOpen(false);
                      setSelectedOrg(null);
                      setDefaults(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <FormComposer form={form} onSubmit={handleEditSubmit}>
                  <div className="flex flex-col gap-[30px]">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                      <Image
                        src={selectedOrg?.logo || orgPlaceholder}
                        alt={selectedOrg?.name}
                        width={60}
                        height={60}
                        className="rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-lg text-black">{selectedOrg?.name}</p>
                        <p className="text-sm text-gray-500">{selectedOrg?.address || selectedOrg?.domain}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created: {formatDateFn(selectedOrg?.created_at || selectedOrg?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <FieldBox
                      bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                      name="name"
                      control={form.control}
                      labelText="Organization name"
                      type="text"
                      placeholder="Enter organization name"
                    />

                    <FieldBox
                      bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                      name="address"
                      control={form.control}
                      labelText="Address"
                      type="text"
                      placeholder="Enter address"
                    />

                    <FieldBox
                      bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                      type="text"
                      name="phoneNumber"
                      control={form.control}
                      labelText="Phone number"
                      placeholder="Enter phone number"
                    />

                    <FieldBox
                      bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                      type="email"
                      name="organizationEmail"
                      control={form.control}
                      labelText="Organization Email"
                      placeholder="Enter email"
                    />

                    <FieldSelect
                      bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                      name="status"
                      control={form.control}
                      options={orgStatus}
                      defaultOption={selectedOrg?.status?.toLowerCase()}
                      labelText="Status"
                      placeholder="Select status"
                    />

                    <div className="flex items-center gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={updatingId === selectedOrg?.id}
                        className="h-[60px] bg-[#003465] text-base font-medium text-white rounded flex-1"
                      >
                        {updatingId === selectedOrg?.id ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditModalOpen(false);
                          setSelectedOrg(null);
                          setDefaults(null);
                        }}
                        className="h-[60px] border border-gray-300 text-base font-medium rounded flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </FormComposer>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal (First) */}
          {deleteModalOpen && selectedOrg && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedOrg(null);
              }}
            >
              <div 
                className="bg-white rounded-lg p-6 w-full max-w-md" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-black">Delete Organization</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setSelectedOrg(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={selectedOrg?.logo || orgPlaceholder}
                      alt={selectedOrg?.name}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-lg text-black">{selectedOrg?.name}</p>
                      <p className="text-sm text-gray-500">{selectedOrg?.address || selectedOrg?.domain}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {formatDateFn(selectedOrg?.created_at || selectedOrg?.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete this organization? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setSelectedOrg(null);
                    }}
                    className="h-[60px] border border-gray-300 text-base font-medium rounded flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setDeleteConfirmOpen(true);
                    }}
                    className="h-[60px] bg-red-600 hover:bg-red-700 text-base font-medium text-white rounded flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Final Delete Confirmation Modal */}
          {deleteConfirmOpen && selectedOrg && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSelectedOrg(null);
              }}
            >
              <div 
                className="bg-white rounded-lg p-6 w-full max-w-md" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-red-600">Confirm Deletion</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setSelectedOrg(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={selectedOrg?.logo || orgPlaceholder}
                      alt={selectedOrg?.name}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-lg text-black">{selectedOrg?.name}</p>
                      <p className="text-sm text-gray-500">{selectedOrg?.address || selectedOrg?.domain}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      You are about to permanently delete:
                    </p>
                    <p className="font-semibold text-black text-lg mb-4">{selectedOrg?.name}</p>
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ This action cannot be undone. All data associated with this organization will be permanently deleted.
                    </p>
                    <p className="text-sm text-gray-600 mt-3">
                      Are you absolutely sure you want to proceed?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setSelectedOrg(null);
                    }}
                    className="h-[60px] border border-gray-300 text-base font-medium rounded flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    disabled={updatingId === selectedOrg?.id}
                    className="h-[60px] bg-red-600 hover:bg-red-700 text-base font-medium text-white rounded flex-1"
                  >
                    {updatingId === selectedOrg?.id ? "Deleting..." : "Yes, Delete Permanently"}
                  </Button>
                </div>
              </div>
            </div>
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
