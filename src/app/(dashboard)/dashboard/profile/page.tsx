"use client";
import { BookUser, CircleUserRound, Lock, Users, User } from "lucide-react";
import React, { useState } from "react";
import Image from "next/image";
import orgProfileImage from "@public/assets/orgProfileImage.png";
import Link from "next/link";
import ProfileForm from "@/components/admin/ProfileForm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ChangePasswordComponent from "@/components/admin/ChangePasswordComponent";
import { useAdminProfile } from "@/hooks/swr";
import { AdminUser } from "@/lib/types";

const tabs = ["Admin Profile", "Change Password"];

const ProfilePage = () => {
  const [tab, setTab] = useState("Admin Profile");
  const { data: admin, isLoading, error } = useAdminProfile();

  // Ensure only a single AdminUser is passed
  const adminData: AdminUser | undefined = Array.isArray(admin) ? admin[0] : admin;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[398px_1fr] gap-5">
      <aside className="pb-10 px-[54px] pt-[34px] pt shadow-[0px_0px_4px_1px_#0000004D] rounded-md sm:min-h-[568px] max-h-[700px]">
        <div className="flex flex-col gap-[15px] items-center mb-[30px]">
          {isLoading ? (
            <div className="w-[180px] h-[180px] rounded-full bg-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#003465] border-blue-200"></div>
            </div>
          ) : adminData?.profile_picture ? (
            <Image
              src={adminData.profile_picture}
              alt="Admin profile"
              width={180}
              height={180}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-[180px] h-[180px] rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-20 h-20 text-gray-400" />
            </div>
          )}
          <div className="text-center">
            {isLoading ? (
              <>
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </>
            ) : (
              <>
                <p className="font-semibold text-2xl text-black">
                  {adminData ? `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim() || 'Admin User' : 'Admin User'}
                </p>
                <p className="text-xs font-normal text-[#999999] mt-1">
                  {adminData?.roles?.[0] || 'Admin'}
                </p>
                <p className="text-xs font-semibold text-[#595959]">
                  Joee Solutions
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          {tabs.map((item) => (
            <Button
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                `font-medium h-[60px] flex items-center justify-start text-sm ${
                  tab === item
                    ? "text-[#003465] bg-[#D9EDFF]"
                    : "text-[#737373] bg-[#F3F3F3]"
                } gap-1 py-[18px] px-7`
              )}
            >
              {item === "Admin Profile" ? (
                <CircleUserRound />
              ) : (
                <Lock className="" />
              )}
              {item}
            </Button>
          ))}
          <Link
            href="/dashboard/admin/create"
            className={cn(
              `font-medium h-[60px] flex items-center justify-start text-sm text-[#737373] bg-[#F3F3F3] gap-1 py-[18px] px-7`
            )}
          >
            <BookUser className="" />
            Create Admin
          </Link>
          <Link
            href="/dashboard/admin/list"
            className={cn(
              `font-medium h-[60px] flex items-center justify-start text-sm text-[#737373] bg-[#F3F3F3] gap-1 py-[18px] px-7`
            )}
          >
            <Users className="fill-current" />
            Admin List
          </Link>
        </div>
      </aside>
      <div className="px-10 pt-[32px] pb-[56px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md h-fit">
        {tab === "Change Password" ? (
          <ChangePasswordComponent />
        ) : isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">Failed to load profile</div>
        ) : (
          <ProfileForm admin={adminData} />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
