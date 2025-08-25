
import PatientList from "@/components/Org/Patients/PatientList";

export default async function PatientsPage(
    {params}:{params:Promise<{org: string}>}
) {
  const {org} = await params;
  return <PatientList slug={org} />;
}

