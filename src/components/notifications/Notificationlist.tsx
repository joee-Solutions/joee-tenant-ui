"use client";

import { notificationData, PatientData } from "@/components/shared/table/data";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabType = "all" | "sent" | "received";
const tabs = {
  all: "All",
  sent: "Sent",
  received: "Received",
};

export default function NotificationList() {
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };
  return (
    <section className=" mb-10">
      <>
        <section className=" shadow-[0px_0px_4px_1px_#0000004D]">
          <header className="flex items-center justify-between gap-5 py-5 border-b px-4">
            <h2 className="font-medium text-lg text-black">
              Notification History
            </h2>

            <Link
              href={"/dashboard/notifications/send"}
              className="text-base text-[#4E66A8] font-normal"
            >
              Send New Notification
            </Link>
          </header>
          <div className="p-[29px_14px_30px_24px]">
            <header className="flex items-center justify-between gap-5 py-6">
              <div className="flex gap-4 mb-6 max-w-3xl w-full">
                {Object.keys(tabs).map((tab) => (
                  <Button
                    key={tab}
                    className={cn(
                      `px-4 py-2 rounded `,
                      activeTab === tab
                        ? "bg-[#003465] text-white font-semibold"
                        : "bg-gray-300 text-[#737373] hover:bg-[#003465] hover:text-white"
                    )}
                    onClick={() => handleTabClick(tab as TabType)}
                  >
                    {tab === "all" ? "All Notifications" : tabs[tab]}
                  </Button>
                ))}
              </div>
              <ListView pageSize={pageSize} setPageSize={setPageSize} />
            </header>
            <DataTable tableDataObj={notificationData[0]}>
              {notificationData.map((data) => {
                return (
                  <TableRow
                    key={data.id}
                    className="px-3 odd:bg-white even:bg-gray-50  hover:bg-gray-100"
                  >
                    <TableCell>{data.id}</TableCell>
                    <TableCell className="py-[10px]">
                      <div className="flex items-center gap-[10px]">
                        {/* <span className="w-[42px] h-42px rounded-full overflow-hidden"></span> */}
                        <p className="font-medium text-xs text-black">
                          {data.sender.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373] py-8">
                      {data.title}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373] break-words">
                      {data.message.length > 30
                        ? data.message.slice(0, 30) + "..."
                        : data.message}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.date}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.organization}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.to}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/dashboard/notifications/${data.title}`}
                        className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6]"
                      >
                        <Ellipsis className="text-black size-5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
            <Pagination
              dataLength={PatientData.length}
              numOfPages={20}
              pageSize={pageSize}
            />
          </div>
        </section>
      </>
    </section>
  );
}
