"use client";
import { Button } from "@/components/ui/button";
import { CircleArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full ">
      <div className="flex gap-2 ">
        <Button
          className="font-semibold text-xl text-black gap-1 p-0 flex items-center rounded-full"
          onClick={() => router.back()}
        >
          <CircleArrowLeft className="fill-[#003465] text-white size-[30px]" />
          Go Back
        </Button>
      </div>
      {children}
    </div>
  );
};

export default AdminLayout;
