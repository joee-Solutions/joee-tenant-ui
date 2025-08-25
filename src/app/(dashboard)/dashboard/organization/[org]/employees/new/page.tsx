
import AddEmployee from "@/components/Org/Employees/AddEmployee";

export default async function NewEmployeePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const org = (await params).slug;
  return <AddEmployee slug={org} />;
}

