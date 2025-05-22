import SingleNotification from "@/components/notifications/SingleNotification";
import React from "react";

const SingleNoficationPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return (
    <div>
      <SingleNotification slug={slug} />
    </div>
  );
};

export default SingleNoficationPage;
