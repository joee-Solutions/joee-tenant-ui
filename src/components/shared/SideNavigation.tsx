"use client";
import { sideNavigation } from "@/utils/navigation";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const SideNavigation = () => {
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
          <div className="flex flex-col items-start gap-4 pl-10 py-7">
            {item.isTitle ? (
              <p className="text-[#E6E6E6] flex gap-3 uppercase">{item.name}</p>
            ) : (
              <Link
                className="text-white flex gap-3 uppercase"
                href={item.href}
              >
                {item.icon && <item.icon />}
                {item.name}
              </Link>
            )}
            <div className="flex flex-col ">
              {item.children &&
                item.children.map((child) => {
                  return (
                    <div key={child.title} className="py-4">
                      <div className="flex items-center gap-4">
                        <Link
                          href={child.href}
                          className="capitalize whitespace-nowrap text-white flex gap-3"
                        >
                          {child.icon && (
                            <child.icon className="text-white h-5 w-5" />
                          )}
                          {child.title}
                        </Link>
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
