"use client";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { useNotificationsByTab } from "@/hooks/swr";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);

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

  const handleDeleteClick = (notification: Notification) => {
    setNotificationToDelete(notification);
    setShowDeleteWarning(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;
    setDeletingId(notificationToDelete.id);
    try {
      await processRequestAuth(
        "delete",
        API_ENDPOINTS.DELETE_NOTIFICATION(notificationToDelete.id)
      );
      toast.success("Notification deleted successfully");
      mutate();
      setShowDeleteWarning(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mb-10">
      <section className="shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex items-center justify-between gap-5 py-5 border-b px-4">
          <h2 className="font-medium text-lg text-black">
            Notification History
          </h2>

          <Link href={"/dashboard/notifications/send"}>
            <Button className="font-normal text-base text-white bg-[#003465] h-[60px] px-6">
              Send New Notification
            </Button>
          </Link>
        </header>
        <div className="px-6 py-8">
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
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-gray-600">Unable to load notifications at this time.</p>
                    <button
                      onClick={() => mutate()}
                      className="px-4 py-2 bg-[#003465] text-white rounded hover:bg-[#122a41] text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </TableCell>
              </TableRow>
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
                      <button
                        onClick={() => handleDeleteClick(data)}
                        className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6] hover:bg-red-50 hover:border-red-300"
                        disabled={deletingId === data.id}
                      >
                        {deletingId === data.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Trash2 className="text-black size-4" />
                        )}
                      </button>
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

      {/* Delete Warning Modal */}
      {showDeleteWarning && notificationToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setShowDeleteWarning(false);
            setNotificationToDelete(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-auto my-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Delete Notification</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteWarning(false);
                  setNotificationToDelete(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the notification <strong>"{notificationToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteWarning(false);
                  setNotificationToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deletingId !== null ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
