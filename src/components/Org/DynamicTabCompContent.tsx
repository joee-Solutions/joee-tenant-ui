"use client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "../ui/button";
import { TabVal } from "@/app/(dashboard)/dashboard/organization/[org]/view/page";
import DepartmentList from "@/components/Org/Departments/DepartmentList";
import AddDepartment from "@/components/Org/Departments/AddDepartmentForm";
import OrgDetails from "@/components/Org/Manage Organization/OrgDetails";
import EmployeeList from "@/components/Org/Employees/EmployeeList";
import AddEmployee from "@/components/Org/Employees/AddEmployee";
import PatientList from "@/components/Org/Patients/PatientList";
import PatientStepper from "@/components/Org/Patients/PatientStepper";
import AppointmentList from "@/components/Org/Appointments/AppointmentList";
import AddAppointment from "@/components/Org/Appointments/AddAppointment";
import ScheduleList from "@/components/Org/Schedule/ScheduleList";
import AddSchedule from "@/components/Org/Schedule/AddSchedule";
import { usePathname } from "next/navigation";

// example , Default Tab based on parent tab 
const innerTabs = [
  // Departments
  { name: "List", text: "Department List", icon: null, parent: "Departments" },
  { name: "Add", text: "Add Department", icon: <FaPlus />, parent: "Departments" },
  // { name: "Backup", text: "Backup", icon: <FaUpload />, parent: "Departments" },

  // Employees
  { name: "List", text: "Employee List", icon: null, parent: "Employees" },
  { name: "Add", text: "Add Employee", icon: <FaPlus />, parent: "Employees" },

  // Patients
  { name: "List", text: "Patient List", icon: null, parent: "Patients" },
  { name: "Add", text: "Add Patient", icon: <FaPlus />, parent: "Patients" },

  // Appointments
  { name: "List", text: "Appointment List", icon: null, parent: "Appointments" },
  { name: "Add", text: "Add Appointment", icon: null, parent: "Appointments" },

  // Schedule
  { name: "List", text: "Schedule List", icon: null, parent: "Schedule" },
  { name: "Add", text: "Add Schedule", icon: <FaPlus />, parent: "Schedule" },

  // Manage Organization
  { name: "Details", text: "Org Details", icon: null, parent: "Manage Organization" },
];



export default function DynamicTabCompContent({
  tabName,
}: {
  tabName: TabVal;
}) {
    const pathname = usePathname();
  
    
    const slug = pathname.split("/")[3]

    // Filter tabs based on the parent tab name
    const filteredTabs = useMemo(() => innerTabs.filter((tab) => tab.parent === tabName), [tabName]);
    const [activeTab, setActiveTab] = useState(filteredTabs[0]?.name || "");

  useEffect(() => {
    setActiveTab(filteredTabs[0]?.name || "");
    // Only run when the parent tab changes (tabName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabName]);


  return (
    <div className="mt-6  bg-white">
      <div className="flex gap-4 mb-6 max-w-3xl w-full">
        {filteredTabs.map((tab) => (
          <Button
            key={tab.name + tab.parent}
            size={"lg"}
            className={cn(
              `px-4 py-2 rounded `,
              activeTab === tab.name
                ? "bg-[#003465] text-white font-semibold"
                : "bg-gray-300 text-[#737373] hover:bg-[#003465] hover:text-white"
            )}
            onClick={() => setActiveTab(tab.name)}
          >
            {tab.text} {tab.icon ? tab.icon : null}
          </Button>
        ))}
      </div>

      <div className="mt-4">
  {/* Departments */}
  {tabName === "Departments" && activeTab === "List" && <DepartmentList slug={slug} />}
  {tabName === "Departments" && activeTab === "Add" && <AddDepartment slug={slug} />}
  {/* {tabName === "Departments" && activeTab === "Backup" && <div>Backup Departments</div>} */}

  {/* Employees */}
  {tabName === "Employees" && activeTab === "List" && <EmployeeList slug={slug} />}
  {tabName === "Employees" && activeTab === "Add" && <AddEmployee slug={slug} />}

  {/* Patients */}
  {tabName === "Patients" && activeTab === "List" && <PatientList slug={slug} />}
  {tabName === "Patients" && activeTab === "Add" && <PatientStepper slug={slug} />}

  {/* Appointments */}
  {tabName === "Appointments" && activeTab === "List" && <AppointmentList slug={slug} />}
  {tabName === "Appointments" && activeTab === "Add" && <AddAppointment slug={slug} />}

  {/* Schedule */}
  {tabName === "Schedule" && activeTab === "List" && <ScheduleList slug={slug} />}
  {tabName === "Schedule" && activeTab === "Add" && <AddSchedule slug={slug} />}

  {/* Manage Organization */}
  {tabName === "Manage Organization" && activeTab === "Details" && <OrgDetails slug={slug} />}
</div>
      
    </div>
  );
}
