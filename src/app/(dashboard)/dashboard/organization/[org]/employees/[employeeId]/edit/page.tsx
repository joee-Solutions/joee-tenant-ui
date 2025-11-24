"use client";

import { usePathname } from "next/navigation";
import EditEmployee from "@/components/Org/Employees/EditEmployee";

export default function EditEmployeePage() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // Remove empty strings
  // Path structure: /dashboard/organization/[org]/employees/[employeeId]/edit
  // After filter: ["dashboard", "organization", "[org]", "employees", "[employeeId]", "edit"]
  
  console.log("Pathname:", pathname);
  console.log("Segments:", segments);
  
  const orgIndex = segments.findIndex(s => s === "organization");
  const org = orgIndex !== -1 && segments[orgIndex + 1] ? segments[orgIndex + 1] : "";
  const employeesIndex = segments.findIndex(s => s === "employees");
  const employeeIdStr = employeesIndex !== -1 && segments[employeesIndex + 1] ? segments[employeesIndex + 1] : "";
  const employeeId = Number(employeeIdStr);

  console.log("Extracted org:", org, "employeeId:", employeeId);

  // Validate that we have valid IDs
  if (!org || isNaN(Number(org))) {
    console.error("Invalid organization ID:", org, "from pathname:", pathname);
    return <div className="p-8 text-center text-red-500">Invalid organization ID: {org}</div>;
  }

  if (!employeeIdStr || isNaN(employeeId)) {
    console.error("Invalid employee ID:", employeeIdStr, "from pathname:", pathname);
    return <div className="p-8 text-center text-red-500">Invalid employee ID: {employeeIdStr}</div>;
  }

  return <EditEmployee slug={org} employeeId={employeeId} />;
}

