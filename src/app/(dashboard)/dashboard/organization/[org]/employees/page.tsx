
import EmployeeList from "@/components/Org/Employees/EmployeeList";

export default async function EmployeesPage(
    {params}:{params:Promise<{org: string}>}
) {
  const {org} = await params;
  return <EmployeeList slug={org} />;
}

