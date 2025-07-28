"use client";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { useNotificationsByTab } from "@/hooks/swr";

export type TabType = "all" | "sent" | "received";
const tabs: Record<TabType, string> = {
  all: "All",
  sent: "Sent",
  received: "Received",
};

// Mock table data structure for notifications
const notificationTableData = [
  {
    id: "ID",
    sender: "Sender",
    title: "Title",
    message: "Message",
    date: "Date",
    organization: "Organization",
    to: "To",
    actions: "Actions",
  },
];

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  user?: {
    first_name: string;
    last_name: string;
  };
  tenant?: {
    name: string;
  };
}

export default function NotificationList() {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Fetch notifications data with tab filtering
  const { data: notificationsData, meta, isLoading, error, mutate } = useNotificationsByTab(activeTab);

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Extract notifications from the response structure
  const notifications = notificationsData || [];
  const totalCount = meta?.total || 0;
  
  // Reset currentPage to 1 if there are no notifications
  useEffect(() => {
    if (totalCount === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalCount, currentPage]);

  // Handle error state
  if (error) {
    return (
      <section className="mb-10">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <h2 className="text-2xl font-semibold text-red-600">Failed to Load Notifications</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <section className="shadow-[0px_0px_4px_1px_#0000004D]">
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
                  disabled={isLoading}
                >
                  {tab === "all" ? "All Notifications" : tabs[tab as TabType]}
                </Button>
              ))}
            </div>
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
          </header>
          <DataTable tableDataObj={notificationTableData[0]}>
            {isLoading ? (
              // Loading skeleton for table rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-[10px]">
                      <SkeletonBox className="w-[42px] h-[42px] rounded-full" />
                      <SkeletonBox className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><SkeletonBox className="h-4 w-32" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-40" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-24" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                  <TableCell>
                    <SkeletonBox className="h-6 w-6 rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : notifications && notifications.length > 0 ? (
              (notifications as Notification[]).map((data: Notification, index: number) => {
                return (
                  <TableRow
                    key={data.id || index}
                    className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                  >
                    <TableCell>{data.id || 'N/A'}</TableCell>
                    <TableCell className="py-[10px]">
                      <div className="flex items-center gap-[10px]">
                        <span className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {/* Add sender avatar here if available */}
                        </span>
                        <p className="font-medium text-xs text-black">
                          {data.user?.first_name ? `${data.user.first_name} ${data.user.last_name}` : 'System'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373] py-8">
                      {data.title || 'No Title'}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373] break-words">
                      {data.message ? (data.message.length > 30
                        ? data.message.slice(0, 30) + "..."
                        : data.message) : 'No Message'}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.tenant?.name || 'All'}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#737373]">
                      {data.user ? `${data.user.first_name} ${data.user.last_name}` : 'All Users'}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/dashboard/notifications/${data.id}`}
                        className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6]"
                      >
                        <Ellipsis className="text-black size-5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {activeTab === "all"
                    ? "No notifications found"
                    : `No ${activeTab} notifications found`
                  }
                </TableCell>
              </TableRow>
            )}
          </DataTable>
          <Pagination
            dataLength={totalCount}
            numOfPages={Math.max(1, Math.ceil(totalCount / pageSize))}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </section>
    </section>
  );
}
