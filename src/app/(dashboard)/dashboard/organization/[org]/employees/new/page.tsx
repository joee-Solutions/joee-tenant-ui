
import AddEmployee from "@/components/Org/Employees/AddEmployee";

export default async function NewEmployeePage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const {org} = (await params);
  return <AddEmployee slug={org} />;
}

