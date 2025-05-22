"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { SearchInput } from "../ui/search";

const Breadcrumb = () => {
  const [pageSize, setPageSize] = useState(10);
  const crumbKey = {
    send: "Send Notification",
    notifications: "Notification List",
  };

  const pathName = usePathname();
  const path = pathName
    .split("/")
    .filter((item) => item !== "")
    .map((item) => {
      if (item.includes("%20")) {
        return item.replace("%20", " ");
      }
      return item;
    })
    .slice(1);
  const lastPath = path[path.length - 1];
  const lastIndex = path.findIndex((item) => item === lastPath);
  console.log("path", path);
  console.log("lastPath", lastPath);
  return (
    <header className="flex items-center justify-between gap-5 py-6">
      <div className="flex items-center gap-2">
        {path.map((item, index) => (
          <div key={index} className="flex items-center gap-1 capitalize">
            {index !== 0 && <span>/</span>}
            <Link
              href={`/dashboard/${
                path.length > 1 && lastIndex === index
                  ? `notifications/${item}`
                  : item
              }`}
              className={cn(
                `text-gray-500 text-xl`,
                (item !== lastPath || index === 0) &&
                  "text-gray-900 font-semibold"
              )}
            >
              {item === lastPath && crumbKey[item] ? crumbKey[item] : item}
            </Link>
          </div>
        ))}
      </div>
      {lastPath !== "send" && (
        <SearchInput
          onSearch={(query: string) => console.log("Searching:", query)}
        />
      )}
    </header>
  );
};

export default Breadcrumb;
