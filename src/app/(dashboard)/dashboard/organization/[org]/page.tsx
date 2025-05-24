import React from "react";
import SingleOrgData from "../SingleOrgData";

const Page = async ({ params }: { params: Promise<{ org: string }> }) => {
  const slug = (await params).org;
  return <SingleOrgData slug={slug} />;
};

export default Page;
