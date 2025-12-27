"use client";

import { DepartmentList } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useMemo, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { formatDateFn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoreVertical, Edit, Trash2, X } from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Spinner } from "@/components/icons/Spinner";

// Define Department type
interface Department {
  id: number;
  name: string;
  userCount: number;
  createdAt: string;
  status: string;
  description?: string;
  image?: string;
}

const DepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  image: z.string().optional(),
  description: z.string().min(1, "Department description is required"),
  status: z.boolean().default(false),
});

type DepartmentSchemaType = z.infer<typeof DepartmentSchema>;

export default function Page({ slug }: { slug: string }) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [fileSelected, setFileSelected] = useState<string>("");
  const { data, mutate } = useSWR(
    API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug)),
    authFectcher
  );

  const editForm = useForm<DepartmentSchemaType>({
    resolver: zodResolver(DepartmentSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      image: "",
      description: "",
      status: false,
    },
  });

  // Filter departments by search query on the frontend
  const filteredDepartments = useMemo(() => {
    if (!Array.isArray(data?.data)) return [];
    
    if (!search.trim()) {
      // No search query - return all departments
      return data.data;
    }
    
    // Filter by search query (case-insensitive)
    // Search in department name
    const searchLower = search.toLowerCase().trim();
    return data.data.filter((dept: Department) => {
      const deptName = dept?.name?.toLowerCase() || '';
      return deptName.includes(searchLower);
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

  const handleDelete = async (deptId: number) => {
    setDeletingId(deptId);
    try {
      await processRequestAuth(
        "delete",
        `${API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug))}/${deptId}`
      );
      toast.success("Department deleted successfully");
      mutate();
      setOpenDropdownId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete department");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (dept: Department) => {
    setSelectedDept(dept);
    editForm.reset({
      name: dept.name || "",
      image: dept.image || "",
      description: dept.description || "",
      status: dept.status?.toLowerCase() === "active",
    });
    setFileSelected(dept.image || "");
    setEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleEditSubmit = async (data: DepartmentSchemaType) => {
    if (!selectedDept) return;
    try {
      const payload = {
        ...data,
        status: data.status ? "active" : "inactive",
      };
      await processRequestAuth(
        "put",
        `${API_ENDPOINTS.TENANTS_DEPARTMENTS(parseInt(slug))}/${selectedDept.id}`,
        payload
      );
      toast.success("Department updated successfully");
      mutate();
      setEditModalOpen(false);
      setSelectedDept(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update department");
    }
  };

  return (
    <section className="max-sm:px-5 mb-10">
      {/* Remove all references to isAddOrg and setIsAddOrg */}
      {/* <NewOrg setIsAddOrg={setIsAddOrg} /> */}
      {/* <OrgManagement setIsAddOrg={setIsAddOrg} /> */}
      {/* <Button
        onClick={() => setIsAddOrg("add")}
        className="text-base text-[#4E66A8] font-normal"
      >
        Add Department
      </Button> */}
      <section className="px-6 py-8 my-8 shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex items-center justify-between border-b-2 gap-5 py-2">
          <h2 className="font-semibold text-xl text-black">
            Department List
          </h2>

          <Link href={`/dashboard/organization/${slug}/departments/new`}>
            <Button className="font-normal text-base text-white bg-[#003465] h-[60px] px-6">
            Add Department
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
              placeholder="Search Departments"
              className="py-[10px] pr-[10px] pl-5 bg-[#EDF0F6] w-full font-normal text-xs text-[#999999] h-full outline-none rounded"
            />
          </div>
        </header>
        <DataTable tableDataObj={DepartmentList[0]} showAction>
          {Array.isArray(filteredDepartments) && filteredDepartments.length > 0 ? (
            filteredDepartments.map((data: Department, index: number) => {
              return (
                <TableRow
                  key={data.id}
                  className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="py-[21px]">
                    <div className="flex items-center gap-[10px]">
                      <p className="font-medium text-xs text-black">
                        {data?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373] w-[180px]">
                    {data?.userCount || 0}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-[#737373]">
                    {formatDateFn(data?.createdAt)}
                  </TableCell>
                  <TableCell
                    className={`font-semibold text-xs ${
                      data?.status.toLowerCase() === "active"
                        ? "text-[#3FA907]"
                        : "text-[#EC0909]"
                    }`}
                  >
                    {data?.status}
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
                              handleEditClick(data);
                            }}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </div>
                      <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    // ...existing click handler logic...
  }}
  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
  disabled={deletingId === data.id}
>
  <Trash2 className="mr-2 h-4 w-4" />
  {deletingId === data.id ? "Deleting..." : "Delete"}
</button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                {search.trim() 
                  ? `No departments found matching "${search}"` 
                  : "No departments found"}
              </TableCell>
            </TableRow>
          )}
        </DataTable>
        <Pagination
          dataLength={filteredDepartments?.length || 0}
          numOfPages={Math.ceil((filteredDepartments?.length || 0) / pageSize)}
          pageSize={pageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </section>

      {/* Edit Department Modal */}
      {editModalOpen && selectedDept && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setEditModalOpen(false);
            setSelectedDept(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Edit Department</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedDept(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
              <div className="mb-4 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
                <div className="flex-1">
                  <label className="block text-base text-black font-normal mb-2">
                    Department name
                  </label>
                  <Input
                    placeholder="Enter here"
                    {...editForm.register("name")}
                    className="w-full h-14 p-3 border border-[#737373] rounded"
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-base text-black font-normal mb-2">
                    Upload Department Image
                  </label>
                  <div className="flex">
                    <div className="flex-1 border h-14 border-[#737373] rounded flex items-center px-4">
                      <span className="mr-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.29241 11.1974C9.26108 11.1664 9.21878 11.149 9.1747 11.149C9.13062 11.149 9.08832 11.1664 9.057 11.1974L6.63624 13.6184C5.51545 14.7393 3.62384 14.858 2.38638 13.6184C1.14684 12.3787 1.26558 10.4891 2.38638 9.36817L4.80714 6.94721C4.87172 6.88263 4.87172 6.77637 4.80714 6.71179L3.978 5.88258C3.94667 5.85156 3.90437 5.83416 3.86029 5.83416C3.81621 5.83416 3.77391 5.85156 3.74259 5.88258L1.32183 8.30353C-0.440611 10.0661 -0.440611 12.9183 1.32183 14.6788C3.08427 16.4393 5.93627 16.4414 7.69663 14.6788L10.1174 12.2579C10.182 12.1933 10.182 12.087 10.1174 12.0225L9.29241 11.1974ZM14.6797 1.32194C12.9173 -0.440647 10.0653 -0.440647 8.30494 1.32194L5.8821 3.74289C5.85108 3.77422 5.83369 3.81652 5.83369 3.86061C5.83369 3.90469 5.85108 3.94699 5.8821 3.97832L6.70916 4.80544C6.77374 4.87003 6.87998 4.87003 6.94457 4.80544L9.36532 2.38449C10.4861 1.2636 12.3777 1.14485 13.6152 2.38449C14.8547 3.62414 14.736 5.51381 13.6152 6.6347L11.1944 9.05565C11.1634 9.08698 11.146 9.12928 11.146 9.17336C11.146 9.21745 11.1634 9.25975 11.1944 9.29108L12.0236 10.1203C12.0881 10.1849 12.1944 10.1849 12.259 10.1203L14.6797 7.69933C16.4401 5.93675 16.4401 3.08453 14.6797 1.32194ZM10.0445 5.09087C10.0131 5.05985 9.97084 5.04245 9.92676 5.04245C9.88268 5.04245 9.84038 5.05985 9.80906 5.09087L5.09046 9.80777C5.05944 9.8391 5.04204 9.8814 5.04204 9.92548C5.04204 9.96957 5.05944 10.0119 5.09046 10.0432L5.91543 10.8682C5.98001 10.9328 6.08626 10.9328 6.15084 10.8682L10.8674 6.15134C10.9319 6.08676 10.9319 5.9805 10.8674 5.91591L10.0445 5.09087Z"
                            fill="#737373"
                          />
                        </svg>
                      </span>
                      <span className="text-gray-500">
                        {fileSelected || "Choose File"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      className="bg-[#003465] hover:bg-[#102437] text-white px-6 py-2 h-14 rounded"
                      onClick={() => document.getElementById("fileInput")?.click()}
                    >
                      Browse
                    </Button>
                    <input
                      id="fileInput"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFileSelected(file.name);
                          editForm.setValue("image", file.name);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="">
                <label className="block text-base text-black font-normal mb-2">
                  Department Description
                </label>
                <Textarea
                  placeholder="Enter description"
                  {...editForm.register("description")}
                  className="w-full p-3 min-h-52 border border-[#737373] rounded"
                />
                {editForm.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="">
                <h3 className="block text-base text-black font-normal mb-2">
                  Status
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inactive"
                      checked={!editForm.watch("status")}
                      onCheckedChange={() => editForm.setValue("status", false)}
                      className="accent-green-600 w-6 h-6 rounded"
                    />
                    <label htmlFor="inactive">Inactive</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={editForm.watch("status")}
                      onCheckedChange={() => editForm.setValue("status", true)}
                      className="accent-green-600 w-6 h-6 rounded"
                    />
                    <label htmlFor="active">Active</label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  className="border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedDept(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-10 text-md rounded min-w-56"
                  disabled={editForm.formState.isSubmitting}
                >
                  {editForm.formState.isSubmitting ? <Spinner/> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
