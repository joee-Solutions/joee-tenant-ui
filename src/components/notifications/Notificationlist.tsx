"use client";

import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Ellipsis, Trash2, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { useNotificationsByTab, useAdminProfile } from "@/hooks/swr";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { mutate } from "swr";

export type TabType = "all" | "sent" | "received";
const tabs: Record<TabType, string> = {
  all: "All",
  sent: "Sent",
  received: "Received",
};

// Mock table data structure for notifications
const notificationTableData = [
  {
    sn: "S/N",
    sender: "Sender",
    title: "Title",
    message: "Message",
    date: "Date",
    organization: "Organization",
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
  sender?: string;
  read?: boolean;
  isRead?: boolean;
  readAt?: string | null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);

  // Fetch notifications data with tab filtering
  const { data: notificationsData, meta, isLoading, error, mutate: mutateTabNotifications } = useNotificationsByTab(activeTab);
  const { data: admin } = useAdminProfile();
  const adminData = Array.isArray(admin) ? admin[0] : admin;

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Extract notifications from the response structure
  const allNotifications = Array.isArray(notificationsData) ? notificationsData : [];
  
  // Filter notifications by search query
  const filteredNotifications = allNotifications.filter((notif: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      notif.title?.toLowerCase().includes(query) ||
      notif.message?.toLowerCase().includes(query) ||
      notif.sender?.toLowerCase().includes(query) ||
      (notif.user?.first_name && `${notif.user.first_name} ${notif.user.last_name}`.toLowerCase().includes(query)) ||
      notif.tenant?.name?.toLowerCase().includes(query)
    );
  });
  
  const totalCount = filteredNotifications.length;
  
  // Apply pagination to filtered notifications
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const notifications = filteredNotifications.slice(startIndex, endIndex);
  
  // Reset currentPage to 1 if there are no notifications or when search changes
  useEffect(() => {
    if (totalCount === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalCount, currentPage, searchQuery]);

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
      setShowDeleteWarning(false);
      setNotificationToDelete(null);
      
      // Refetch notifications from API to update the table
      mutateTabNotifications();
      
      // Also invalidate main notifications cache to update bell icon
      mutate(API_ENDPOINTS.GET_NOTIFICATIONS);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle view notification
  const handleViewNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true);
    
    // Mark as read if not already read
    if (notification.read !== true && notification.isRead !== true && (!notification.readAt || notification.readAt === null)) {
      await markNotificationAsRead(notification.id);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId);
    try {
      // Store read notification ID in localStorage for persistence
      const storedReadNotifications = localStorage.getItem('readNotifications');
      const readIds = storedReadNotifications ? JSON.parse(storedReadNotifications) : [];
      if (!readIds.includes(notificationId)) {
        readIds.push(notificationId);
        localStorage.setItem('readNotifications', JSON.stringify(readIds));
      }
      
      // Get the current endpoint for this tab
      const currentEndpoint = `${API_ENDPOINTS.GET_NOTIFICATIONS}${activeTab !== "all" ? `?tab=${activeTab}` : ""}`;
      
      // Optimistically update the current tab's notifications cache
      mutateTabNotifications(
        (currentData: any) => {
          if (!currentData) return currentData;
          
          // Extract the actual notifications array
          const notifications = Array.isArray(currentData) 
            ? currentData 
            : (currentData?.data || currentData?.results || []);
          
          // Update the notification that was marked as read
          const updatedNotifications = notifications.map((n: Notification) => {
            if (n.id === notificationId) {
              return {
                ...n,
                read: true,
                isRead: true,
                readAt: new Date().toISOString(),
              };
            }
            return n;
          });
          
          // Return in the same format as the original data
          if (Array.isArray(currentData)) {
            return updatedNotifications;
          } else if (currentData?.data) {
            return { ...currentData, data: updatedNotifications };
          } else if (currentData?.results) {
            return { ...currentData, results: updatedNotifications };
          }
          return updatedNotifications;
        },
        false // Don't revalidate immediately
      );
      
      // Also optimistically update the main notifications endpoint for the header bell
      mutate(
        API_ENDPOINTS.GET_NOTIFICATIONS,
        (currentData: any) => {
          if (!currentData) return currentData;
          
          const notifications = Array.isArray(currentData) 
            ? currentData 
            : (currentData?.data || currentData?.results || []);
          
          const updatedNotifications = notifications.map((n: Notification) => {
            if (n.id === notificationId) {
              return {
                ...n,
                read: true,
                isRead: true,
                readAt: new Date().toISOString(),
              };
            }
            return n;
          });
          
          if (Array.isArray(currentData)) {
            return updatedNotifications;
          } else if (currentData?.data) {
            return { ...currentData, data: updatedNotifications };
          } else if (currentData?.results) {
            return { ...currentData, results: updatedNotifications };
          }
          return updatedNotifications;
        },
        false
      );
      
      // No API call - endpoint doesn't exist, client-side only update
      // The optimistic update above handles the UI change
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
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
            <div className="flex gap-4 mb-6 max-w-3xl w-full flex-1">
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
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003465] w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
            </div>
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
            </div>
          </header>
          <DataTable tableDataObj={notificationTableData[0]}>
            {isLoading ? (
              // Loading skeleton for table rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="px-3 odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-24" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-32" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-40" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-24" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <SkeletonBox className="h-6 w-6 rounded" />
                    <SkeletonBox className="h-6 w-6 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : error && (!notifications || (Array.isArray(notifications) && notifications.length === 0)) ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-gray-600">Unable to load notifications at this time.</p>
                    <button
                      onClick={() => mutateTabNotifications()}
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
                    {/* S/N Column */}
                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="py-[10px]">
                        <p className="font-medium text-xs text-black">
                        {data.sender || (data.user ? `${data.user.first_name} ${data.user.last_name}` : 'System')}
                        </p>
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

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewNotification(data)}
                          className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6] hover:bg-blue-50 hover:border-blue-300"
                          disabled={markingAsRead === data.id}
                          title="View notification"
                        >
                          {markingAsRead === data.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Eye className="text-black size-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(data)}
                          className="flex items-center justify-center px-2 h-6 rounded-[2px] border border-[#BFBFBF] bg-[#EDF0F6] hover:bg-red-50 hover:border-red-300"
                          disabled={deletingId === data.id}
                          title="Delete notification"
                      >
                          {deletingId === data.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Trash2 className="text-black size-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={() => {
            setShowDeleteWarning(false);
            setNotificationToDelete(null);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-xl"
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

      {/* View Notification Modal */}
      {showViewModal && selectedNotification && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={() => {
            setShowViewModal(false);
            setSelectedNotification(null);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-[#003465] pr-4">
                {selectedNotification.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedNotification(null);
                }}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Message</p>
                <p className="text-base text-gray-800 whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Sender</p>
                  <p className="text-sm text-gray-800">
                    {selectedNotification.sender || 
                     (selectedNotification.user 
                       ? `${selectedNotification.user.first_name} ${selectedNotification.user.last_name}`
                       : 'System')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Date</p>
                  <p className="text-sm text-gray-800">
                    {selectedNotification.createdAt
                      ? new Date(selectedNotification.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                {selectedNotification.tenant && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Organization</p>
                    <p className="text-sm text-gray-800">
                      {selectedNotification.tenant.name || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedNotification(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
