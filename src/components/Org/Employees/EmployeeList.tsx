"use client";

import { EmployeesData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useMemo, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { MoreVertical, Edit, Trash2, X } from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import EditEmployee from "./EditEmployee";

// Define Employee type
interface Employee {
  id: number;
  firstname: string;
  lastname: string;
  department?: { name?: string } | string;
  designation?: string;
  isActive?: boolean;
  roles?: Array<{ id: number; name: string }>;
  email?: string;
  gender?: string;
  image_url?: string;
  status?: string;
}

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  
  const orgId = slug && !isNaN(parseInt(slug)) ? parseInt(slug) : null;
  
  const { data, isLoading, error, mutate } = useSWR(
    orgId ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(orgId) : null,
    authFectcher
  );

  // Filter employees by search query on the frontend
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(data?.data)) return [];
    
    if (!search.trim()) {
      // No search query - return all employees
      return data.data;
    }
    
    // Filter by search query (case-insensitive)
    // Search in employee name, email, department, designation
    const searchLower = search.toLowerCase().trim();
    return data.data.filter((employee: Employee) => {
      const fullName = `${employee?.firstname || ''} ${employee?.lastname || ''}`.toLowerCase();
      const email = employee?.email?.toLowerCase() || '';
      const department = typeof employee.department === 'string'
        ? employee.department.toLowerCase()
        : employee.department?.name?.toLowerCase() || '';
      const designation = employee?.designation?.toLowerCase() || '';
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             department.includes(searchLower) ||
             designation.includes(searchLower);
    });
  }, [data?.data, search]);

  // Reset to page 1 when search changes
  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current !== search) {
      setCurrentPage(1);
    }
    prevSearch.current = search;
  }, [search]);

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

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteWarning(true);
    setOpenDropdownId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    setDeletingId(employeeToDelete.id);
    try {
      await processRequestAuth(
        "delete",
        API_ENDPOINTS.UPDATE_TENANT_EMPLOYEE(parseInt(slug), employeeToDelete.id)
      );
      toast.success("Employee deleted successfully");
      mutate();
      setShowDeleteWarning(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete employee");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleEditDone = () => {
    setEditModalOpen(false);
    setSelectedEmployeeId(null);
    mutate();
  };

  return (
    <section className=" mb-10">
      <>
        <section className="px-6 py-8 shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex justify-between items-center border-b-2  py-4 mb-8">
            <h2 className="font-semibold text-xl text-black">Employee List</h2>

            <Link href={`/dashboard/organization/${slug}/employees/new`}>
              <Button className="font-normal text-base text-white bg-[#003465] h-[60px] px-6">
              Add Employee
              </Button>
            </Link>
          </header>
          <header className="flex items-center justify-between gap-5 py-6">
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            <div className="w-full max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Employees"
                className="py-[10px] pr-[10px] pl-5 bg-[#EDF0F6] w-full font-normal text-xs text-[#999999] h-full outline-none rounded"
              />
            </div>
          </header>
          <DataTable tableDataObj={EmployeesData[0]} showAction>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : error && (!data || (Array.isArray(data) && data.length === 0)) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No employees found
                </TableCell>
              </TableRow>
            ) : Array.isArray(filteredEmployees) && filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee: Employee, index: number) => (
              <TableRow
                key={employee.id}
                className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100"
              >
                <TableCell>
                  {index + 1}
                </TableCell>
                <TableCell className="py-[21px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="w-[42px] h-[42px] rounded-full overflow-hidden">
                      <Image
                        src={employee?.image_url || orgPlaceholder}
                        alt="employee image"
                        width={42}
                        height={42}
                        className="object-cover aspect-square w-full h-full"
                      />
                    </span>
                    <p className="font-medium text-xs text-black">
                      {employee?.firstname} {employee?.lastname}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                  {typeof employee.department === 'string'
                    ? employee.department
                    : employee.department?.name || "N/A"}
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#737373]">
                  {employee?.designation || "N/A"}
                </TableCell>
                <TableCell
                  className={`font-semibold text-xs ${
                    employee?.status?.toLowerCase() === "active"
                      ? "text-[#3FA907]"
                      : "text-[#EC0909]"
                  }`}
                >
                  {employee?.status}
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <button
                      className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-gray-100 rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === employee.id ? null : employee.id);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openDropdownId === employee.id && (
                      <div 
                        className={`absolute right-0 z-[100] min-w-[120px] overflow-visible rounded-md border bg-white p-1 shadow-lg ${
                          // Show above if it's the last item, last 2 items, or if there's only 1 item
                          index >= filteredEmployees.length - 2 || filteredEmployees.length === 1 ? 'bottom-10' : 'top-10'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'absolute' }}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(employee);
                          }}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(employee);
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
                  {search.trim() 
                    ? `No employees found matching "${search}"` 
                    : "No employees found"}
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={filteredEmployees?.length || 0}
            numOfPages={Math.ceil((filteredEmployees?.length || 0) / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </>

      {/* Delete Warning Modal */}
      {showDeleteWarning && employeeToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setShowDeleteWarning(false);
            setEmployeeToDelete(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-auto my-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Delete Employee</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteWarning(false);
                  setEmployeeToDelete(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{employeeToDelete.firstname} {employeeToDelete.lastname}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteWarning(false);
                  setEmployeeToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deletingId !== null ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editModalOpen && selectedEmployeeId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setEditModalOpen(false);
            setSelectedEmployeeId(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto my-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Edit Employee</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedEmployeeId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <EditEmployee 
              slug={slug} 
              employeeId={selectedEmployeeId} 
              onDone={handleEditDone}
            />
          </div>
        </div>
      )}
    </section>
  );
}
