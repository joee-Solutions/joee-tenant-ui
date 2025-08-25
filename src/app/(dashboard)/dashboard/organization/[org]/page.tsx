import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const slug = (await params).org;
  // Make departments the default landing page
  redirect(`/dashboard/organization/${slug}/departments`);
}
