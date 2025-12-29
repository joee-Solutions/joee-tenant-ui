"use client";

import { FC, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { formatDateFn } from "@/lib/utils";

interface Employee {
  id: number;
  name: string;
  role: string;
  organization: string;
  description?: string;
  image: string;
  orgId: number;
}

interface EmployeeSectionProps {
  employees: Employee[];
}

const EmployeeSection: FC<EmployeeSectionProps> = ({ employees }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Fetch employee details when an employee is selected
  const { data: employeeDetails, isLoading: isLoadingDetails } = useSWR(
    selectedEmployeeId && selectedOrgId
      ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(selectedOrgId)
      : null,
    authFectcher
  );

  // Find the selected employee from the fetched data
  const selectedEmployee = selectedEmployeeId && employeeDetails?.data
    ? (Array.isArray(employeeDetails.data) 
        ? employeeDetails.data.find((e: any) => e.id === selectedEmployeeId)
        : null)
    : null;

  const handleEmployeeClick = (employeeId: number, orgId: number) => {
    setSelectedEmployeeId(employeeId);
    setSelectedOrgId(orgId);
  };

  const closeModal = () => {
    setSelectedEmployeeId(null);
    setSelectedOrgId(null);
  };

  if (!employees || employees.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-[300px] w-full flex items-center justify-center text-gray-500">
        No employees to display
      </div>
    );
  }
  const mainEmployee = employees[0];
  const otherEmployees = employees.slice(1, 5); // Limit to 4 employees (indices 1-4)

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        
        <div className="relative  p-6 text-white  bg-no-repeat bg-center bg-cover h-[170px]" style={{backgroundImage: "url('assets/images/employeebg.png')"}}>
         <div className="absolute inset-0 bg-[#003465] opacity-75 z-0"></div>
        <div className="relative z-10 flex justify-between items-center w-full ">
          <h3 className="font-semibold text-lg ">Employees</h3>
          </div>
        </div>


        <div className="flex flex-col items-center -mt-12 text-center">
          <div className="relative w-[180px] h-[180px] rounded-full border-8 border-[#003465] overflow-hidden">
            <Image src={mainEmployee?.image || "/assets/images/employeeprofile.png"} alt={mainEmployee?.name || "Employee"} layout="fill" objectFit="cover" />
          </div>
          <h4 className="mt-4 text-xl font-medium text-black">{mainEmployee?.name}</h4>
          <p className="text-gray-500">{mainEmployee?.organization}</p>
          <p className="mt-3 text-md max-w-lg text-[#999999] px-6">
            {mainEmployee?.description}
          </p>
          <button 
            onClick={() => handleEmployeeClick(mainEmployee.id, mainEmployee.orgId)}
            className="my-4 bg-[#003465] text-white px-12 text-lg py-2 rounded-lg shadow hover:bg-[#122a41] cursor-pointer"
          >
            View Details
          </button>
        </div>

      
        <div className="border-t border-gray-200 p-8 grid grid-cols-2 gap-4">
          {otherEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => handleEmployeeClick(employee.id, employee.orgId)}
              className={`flex items-center gap-3 ${employee.role.includes("Nurse") ? "border-0 md:border-r-2" : "border-0"} hover:opacity-85 transition-opacity cursor-pointer text-left`}
            >
              <div
                className={`relative w-[60px] h-[60px] rounded-full border-2 overflow-hidden ${
                  employee.role.includes("Doctor") ? "border-red-500" : "border-yellow-500"
                }`}
              >
                <Image src={employee?.image || "/assets/images/employeeprofile.png"} alt={employee?.name || "Employee"} layout="fill" objectFit="cover" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{employee?.name}</h4>
                <p className="text-xs text-gray-500">{employee?.organization}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployeeId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Employee Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {isLoadingDetails ? (
              <div className="text-center py-8 text-gray-500">Loading employee details...</div>
            ) : selectedEmployee ? (
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative w-[120px] h-[120px] rounded-full border-4 border-[#003465] overflow-hidden">
                    <Image 
                      src={selectedEmployee.image_url || "/assets/images/employeeprofile.png"} 
                      alt={`${selectedEmployee.firstname} ${selectedEmployee.lastname}`} 
                      width={120}
                      height={120}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Name</h4>
                    <p className="text-gray-900">{selectedEmployee.firstname} {selectedEmployee.lastname}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Email</h4>
                    <p className="text-gray-900">{selectedEmployee.email || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Phone</h4>
                    <p className="text-gray-900">{selectedEmployee.phone_number || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Gender</h4>
                    <p className="text-gray-900">{selectedEmployee.gender || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Department</h4>
                    <p className="text-gray-900">
                      {typeof selectedEmployee.department === 'string'
                        ? selectedEmployee.department
                        : selectedEmployee.department?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Designation</h4>
                    <p className="text-gray-900">{selectedEmployee.designation || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Date of Birth</h4>
                    <p className="text-gray-900">
                      {selectedEmployee.date_of_birth 
                        ? formatDateFn(selectedEmployee.date_of_birth) 
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Status</h4>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedEmployee.isActive || selectedEmployee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedEmployee.isActive || selectedEmployee.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  {selectedEmployee.address && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-gray-700 mb-1">Address</h4>
                      <p className="text-gray-900">{selectedEmployee.address}</p>
                    </div>
                  )}
                  {selectedEmployee.about && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-gray-700 mb-1">About</h4>
                      <p className="text-gray-900">{selectedEmployee.about}</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-center">
                  <Link href={`/dashboard/organization/${selectedOrgId}/employees`}>
                    <Button className="bg-[#003465] text-white hover:bg-[#122a41]">
                      View All Employees
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Employee details not found</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeSection;
