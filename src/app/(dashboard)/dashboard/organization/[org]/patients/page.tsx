import { Suspense } from "react";
import PatientList from "@/components/Org/Patients/PatientList";

export default async function PatientsPage(
    {params}:{params:Promise<{org: string}>}
) {
  const {org} = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading patients…</div>}>
      <PatientList org={org} />
    </Suspense>
  );
}

