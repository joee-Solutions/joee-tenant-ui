"use client";
import { useTenant } from "@/hooks/swr";
import { CircleArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

const OrgLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  
  const companyName = pathname.split("/")[3]

  const { data } = useTenant(companyName);
  return (
    <div className="px-4 pb-20 flex flex-col gap-[30px]">
      <div>
        <Link
          href="/dashboard/organization"
          className="font-semibold text-2xl text-black gap-1 p-0 flex items-center"
        >
          <CircleArrowLeft className="fill-[#003465] text-white size-[39px]" />
          {data?.name}
        </Link>
      </div>
      {children}
    </div>
  );
};

export default OrgLayout;
