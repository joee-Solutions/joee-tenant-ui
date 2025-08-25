
import DepartmentList from "@/components/Org/Departments/DepartmentList";

export default async function DepartmentsPage(
    { params }: { params: Promise<{ org: string }> }
) {
    const { org } = await params;
    return <DepartmentList slug={org} />;
}

