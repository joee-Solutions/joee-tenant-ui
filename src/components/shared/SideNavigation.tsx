"use client";
import { sideNavigation } from "@/utils/navigation";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const SideNavigation = () => {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      Cookies.remove("auth_token");
      router.push("/auth/login");
    } catch (error) {}
  };
  const pathName = usePathname();
  const isPathNameMatch = (path: string) => {
    return pathName === path;
  };
  return (
    <div className="lg:fixed lg:w-72 bg-[#003465] overflow-y-scroll z-[100] min-h-screen lg:inset-y-0">
      <div className=" text-white py-12 flex flex-col items-center justify-center gap-2">
        <Image
          width={200}
          height={200}
          src="/assets/logo/logo.png"
          alt=""
          className="w-16 h-16"
        />
        <p>LociCare by Joee</p>
      </div>
      <div className="border-b border-white"></div>
      {sideNavigation.map((item, index) => (
        <div key={item.name} className="">
          {item.showRuler && <div className="border-b border-white"></div>}
          <div
            className={cn(
              "flex flex-col items-start gap-4 pl-16 py-7",
              isPathNameMatch(item.href) ? "pl-8" : ""
            )}
          >
            {item.isTitle ? (
              <p className="text-[#E6E6E6] flex gap-3 uppercase">{item.name}</p>
            ) : (
              <Link
                className={cn(
                  "text-white flex gap-3 uppercase w-full py-4 items-center",
                  isPathNameMatch(item.href)
                    ? "text-black bg-white rounded-l-full pl-3"
                    : ""
                )}
                href={item.href}
              >
                {item.icon && (
                  <item.icon
                    className={cn(
                      "text-inherit",
                      isPathNameMatch(item.href)
                        ? "fill-[#0085FF] text-[#0085FF]"
                        : ""
                    )}
                  />
                )}
                {item.name}
                {isPathNameMatch(item.href) && (
                  <span className="bg-black  h-1.5 w-1.5 rounded-full"></span>
                )}
              </Link>
            )}
            <div className="flex flex-col ">
              {item.children &&
                item.children.map((child) => {
                  return (
                    <div key={child.title} className="py-4">
                      <div className="flex items-center gap-4">
                        {!child.href ? (
                          <button
                            className="capitalize whitespace-nowrap text-white flex gap-3"
                            onClick={handleLogout}
                          >
                            {child.icon && (
                              <child.icon className="text-white h-5 w-5" />
                            )}
                            {child.title}
                          </button>
                        ) : (
                          <Link
                            href={child.href}
                            className="capitalize whitespace-nowrap text-white flex gap-3"
                          >
                            {child.icon && (
                              <child.icon
                                className={cn("text-white h-5 w-5")}
                              />
                            )}
                            {child.title}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          {item.showRuler && index + 1 !== item.children?.length && (
            <div className="border-b border-white"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SideNavigation;
