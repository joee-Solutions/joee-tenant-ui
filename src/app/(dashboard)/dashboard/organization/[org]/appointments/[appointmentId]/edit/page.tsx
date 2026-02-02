"use client";

import { usePathname } from "next/navigation";
import EditAppointment from "@/components/Org/Appointments/EditAppointment";

export default function EditAppointmentPage() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  
  // Path structure: /dashboard/organization/[org]/appointments/[appointmentId]/edit
  // After filter: ["dashboard", "organization", "[org]", "appointments", "[appointmentId]", "edit"]
  
  const orgIndex = segments.findIndex(s => s === "organization");
  const org = orgIndex !== -1 && segments[orgIndex + 1] ? segments[orgIndex + 1] : "";
  const appointmentsIndex = segments.findIndex(s => s === "appointments");
  const appointmentIdStr = appointmentsIndex !== -1 && segments[appointmentsIndex + 1] ? segments[appointmentsIndex + 1] : "";
  const appointmentId = Number(appointmentIdStr);

  // Validate that we have valid IDs
  if (!org || isNaN(Number(org))) {
    return <div className="p-8 text-center text-red-500">Invalid organization ID: {org}</div>;
  }

  if (!appointmentIdStr || isNaN(appointmentId)) {
    return <div className="p-8 text-center text-red-500">Invalid appointment ID: {appointmentIdStr}</div>;
  }

  return <EditAppointment slug={org} appointmentId={appointmentId} />;
}

