"use client";

import { usePathname } from "next/navigation";
import PatientStepper from "@/components/Org/Patients/PatientStepper";

export default function EditPatientPage() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  
  // Path structure: /dashboard/organization/[org]/patients/[patientId]/edit
  // After filter: ["dashboard", "organization", "[org]", "patients", "[patientId]", "edit"]
  
  const orgIndex = segments.findIndex(s => s === "organization");
  const org = orgIndex !== -1 && segments[orgIndex + 1] ? segments[orgIndex + 1] : "";
  const patientsIndex = segments.findIndex(s => s === "patients");
  const patientIdStr = patientsIndex !== -1 && segments[patientsIndex + 1] ? segments[patientsIndex + 1] : "";
  const patientId = Number(patientIdStr);

  // Validate that we have valid IDs
  if (!org || isNaN(Number(org))) {
    return <div className="p-8 text-center text-red-500">Invalid organization ID: {org}</div>;
  }

  if (!patientIdStr || isNaN(patientId)) {
    return <div className="p-8 text-center text-red-500">Invalid patient ID: {patientIdStr}</div>;
  }

  return <PatientStepper slug={org} patientId={patientId} />;
}

