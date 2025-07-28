"use client";
import { WebIcon } from "@/components/icons/icon";
import { Hospital, CloudIcon } from "lucide-react";
import React from "react";

import EditOrg from "./EditOrg";
import Image from "next/image";
import orgProfileImage from "@public/assets/orgProfileImage.png";
import Link from "next/link";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { SkeletonBox } from "@/components/shared/loader/skeleton";

const SingleOrgData = ({ slug }: { slug: string }) => {
  const path = API_ENDPOINTS.GET_TENANT(slug);
  const { data:profiledata, isLoading, error } = useSWR(path, authFectcher);
  const data = profiledata?.data;
  return (
    <div className="">
      <div className="grid grid-cols-1 sm:grid-cols-[398px_1fr] gap-5">
        {isLoading && !data && <SkeletonBox className="sm:h-[568px]" />}
        {!isLoading && (
          <aside className="pb-10 px-[54px] pt-[34px] pt shadow-[0px_0px_4px_1px_#0000004D] rounded-md sm:h-[568px]">
            <div className="flex flex-col gap-[15px] items-center mb-[30px]">
              <Image
                src={orgProfileImage}
                alt="Organization image"
                width={180}
                height={180}
                className="rounded-full"
              />
              <div className="text-center">
                <p className="font-semibold text-2xl text-black">
                  {data?.name || "Organization Name"}
                </p>
                <p className="text-xs font-normal text-[#999999] mt-1">
                  {data?.profile?.address_metadata?.state} {" , "}
                  {data?.profile?.address_metadata?.country}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <Link
                href="/dashboard/organization#"
                className={`font-medium h-[60px] flex items-center justify-start text-sm ${"text-[#003465] bg-[#D9EDFF]"} gap-1 py-[18px] px-7`}
              >
                <Hospital />
                Organization Profile
              </Link>
              <Link
                href={`/dashboard/organization/${slug}/view`}
                className={`font-medium h-[60px] flex items-center justify-start text-sm ${"text-[#003465] bg-[#D9EDFF]"} gap-1 py-[18px] px-7`}
              >
                <WebIcon className="fill-current" />
                Check HMS
              </Link>
              <Link
                href={`/dashboard/organization/${slug}/backup`}
                className={`font-medium h-[60px] flex items-center justify-start text-sm ${"text-[#003465] bg-[#D9EDFF]"} gap-1 py-[18px] px-7`}
              >
                <CloudIcon className="fill-current" />
                Backup Restore
              </Link>
            </div>
          </aside>
        )}
        <div className="px-10 pt-[32px] pb-[56px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md">
          { data && <EditOrg  data={data} slug={slug}/>}
        </div>
      </div>
    </div>
  );
};

export default SingleOrgData;
