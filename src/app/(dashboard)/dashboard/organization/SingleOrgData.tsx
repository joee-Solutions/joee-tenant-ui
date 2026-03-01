"use client";
import { WebIcon } from "@/components/icons/icon";
import { Hospital, CloudIcon, Cloud, RotateCcw } from "lucide-react";
import React, { useState } from "react";

import EditOrg from "./EditOrg";
import Image from "next/image";
import orgProfileImage from "@public/assets/orgProfileImage.png";
import Link from "next/link";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { Button } from "@/components/ui/button";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";

const SingleOrgData = ({ slug }: { slug: string }) => {
  const path = API_ENDPOINTS.GET_TENANT(slug);
  const { data: profiledata, isLoading, error } = useSWR(path, authFectcher);
  const data = profiledata?.data;
  const tenantId = data?.id ?? (slug && /^\d+$/.test(String(slug)) ? parseInt(String(slug), 10) : null);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const handleCreateBackup = async () => {
    if (!tenantId || typeof tenantId !== "number") {
      toast.error("Organization ID is required to create a backup");
      return;
    }
    setCreatingBackup(true);
    try {
      await processRequestAuth("post", API_ENDPOINTS.CREATE_TENANT_BACKUP(tenantId), { tenantId: Number(tenantId) });
      toast.success("Backup created successfully");
    } catch (err: any) {
      console.error("Backup creation error:", err);
      toast.error(err?.response?.data?.message || "Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

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
          {/* Backup & Restore action buttons */}
          {data && tenantId != null && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="bg-[#003465] text-white hover:bg-[#003465]/90 h-11 px-5"
              >
                <Cloud className="w-4 h-4 mr-2" />
                {creatingBackup ? "Creating backup..." : "Backup"}
              </Button>
              <Link href={`/dashboard/organization/${slug}/backup`}>
                <Button
                  variant="outline"
                  className="h-11 px-5 border-[#003465] text-[#003465] hover:bg-[#D9EDFF]"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </Button>
              </Link>
            </div>
          )}
          { data && <EditOrg  data={data} slug={slug}/>}
        </div>
      </div>
    </div>
  );
};

export default SingleOrgData;
