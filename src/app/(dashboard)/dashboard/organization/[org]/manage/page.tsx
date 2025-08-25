
import OrgDetails from "@/components/Org/Manage Organization/OrgDetails";

export default async function ManageOrganizationPage(
    {params}:{params:Promise<{org: string}>}
) {
  const {org} = await params;
  return <OrgDetails slug={org} />;
}

