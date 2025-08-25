import AddDepartment from "@/components/Org/Departments/AddDepartmentForm"

export default async function Page({
    params,
}: {
    params: Promise<{ org: string }>
}) {
    
    const {org} = (await params);
    return <AddDepartment slug={org} />
}