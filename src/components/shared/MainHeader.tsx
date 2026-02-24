'use client'
import { useState, useEffect, useMemo, Suspense } from "react";
import { IoSettingsSharp } from "react-icons/io5";
import { SearchIcon, Menu, X } from "lucide-react";
import { BellIcon } from "../icons/icon";
import Image from "next/image";
import profileImage from "./../../../public/assets/profile.png";
import { useAdminProfile, useNotificationsData } from "@/hooks/swr";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "react-toastify";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Notification } from "@/lib/types";

interface MainHeaderContentProps {
  isMobileMenuOpen?: boolean;
  toggleMobileMenu?: () => void;
}

const MainHeaderContent = ({ isMobileMenuOpen, toggleMobileMenu }: MainHeaderContentProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null); 
  
  // Sync search query with URL params if on organization page
  useEffect(() => {
    if (pathname?.includes("/organization")) {
      const urlSearch = searchParams?.get("search") || "";
      setSearchQuery(urlSearch);
    }
  }, [pathname, searchParams]);
  
  const { data: admin, isLoading } = useAdminProfile();
  const adminData = Array.isArray(admin) ? admin[0] : admin;
  const fullName = adminData ? `${adminData.first_name || ""} ${adminData.last_name || ""}`.trim() : "";
  const role = adminData?.roles?.[0]?.split("_").join(" ") || "Admin";
  
  // Use SWR hook for notifications to enable automatic refetching
  const { data: notificationsData, isLoading: loadingNotifications } = useNotificationsData();
  
  // Load read notifications from localStorage on mount and merge with notifications
  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') return;
    
    const storedReadNotifications = localStorage.getItem('readNotifications');
    if (storedReadNotifications && notificationsData) {
      try {
        const readIds = JSON.parse(storedReadNotifications);
        // Merge with current notifications data
        mutate(
          API_ENDPOINTS.GET_NOTIFICATIONS,
          (currentData: any) => {
            if (!currentData) return currentData;
            const notifications = Array.isArray(currentData) ? currentData : (currentData?.data || currentData?.results || []);
            return notifications.map((n: Notification) => {
              if (readIds.includes(n.id)) {
                return { ...n, read: true, isRead: true, readAt: n.readAt || new Date().toISOString() };
              }
              return n;
            });
          },
          false
        );
      } catch (error) {
        console.error("Error loading read notifications from localStorage:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsData]);
  
  // Calculate unread count from notifications list and get top 10 latest notifications
  // Use useMemo with notificationsData as dependency to recalculate when SWR refetches
  const { notifications, unreadCount } = useMemo(() => {
    // Handle different data structures - flatten if nested array
    let notifs: Notification[] = [];
    if (Array.isArray(notificationsData)) {
      // Check if it's a nested array
      if (notificationsData.length > 0 && Array.isArray(notificationsData[0])) {
        notifs = (notificationsData as any).flat() as Notification[];
      } else {
        notifs = notificationsData as Notification[];
      }
    }
    
    // Load read notification IDs from localStorage (only on client side)
    let readIds: number[] = [];
    if (typeof window !== 'undefined') {
      try {
        const storedReadNotifications = localStorage.getItem('readNotifications');
        readIds = storedReadNotifications ? JSON.parse(storedReadNotifications) : [];
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        readIds = [];
      }
    }
    
    // Merge read status from localStorage
    notifs = notifs.map((n: Notification) => {
      if (readIds.includes(n.id)) {
        return { ...n, read: true, isRead: true, readAt: n.readAt || new Date().toISOString() };
      }
      return n;
    });
    
    // Sort notifications by createdAt (newest first)
    const sortedNotifs = [...notifs].sort((a: Notification, b: Notification) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Get top 10 latest notifications
    const topTenNotifications = sortedNotifs.slice(0, 10);
    
    // Calculate unread count from the top 10 notifications
    // If read property doesn't exist or is false, it's unread
    // New notifications typically don't have a read property, so treat as unread
    const count = topTenNotifications.filter((n: Notification) => {
      // If read property is explicitly true, it's read
      // Otherwise (undefined, null, false), treat as unread
      return n.read !== true && n.isRead !== true && (!n.readAt || n.readAt === null);
    }).length;
    
    return { notifications: topTenNotifications, unreadCount: count };
  }, [notificationsData]);

  // Handle notification click - open modal and mark as read
  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
    setIsNotificationOpen(false);
    
    // Mark as read if not already read
    if (notification.read !== true && notification.isRead !== true && (!notification.readAt || notification.readAt === null)) {
      await markNotificationAsRead(notification.id);
    }
  };

  // Mark notification as read (client-side only, no API endpoint available)
  const markNotificationAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId);
    try {
      // Store read notification ID in localStorage for persistence (only on client side)
      if (typeof window !== 'undefined') {
        const storedReadNotifications = localStorage.getItem('readNotifications');
        const readIds = storedReadNotifications ? JSON.parse(storedReadNotifications) : [];
        if (!readIds.includes(notificationId)) {
          readIds.push(notificationId);
          localStorage.setItem('readNotifications', JSON.stringify(readIds));
        }
      }
      
      // Optimistically update the cache immediately - no API call since endpoint doesn't exist
      mutate(
        API_ENDPOINTS.GET_NOTIFICATIONS,
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
        false // Don't revalidate, this is client-side only
      );
      } catch (error) {
      console.error("Error marking notification as read:", error);
      } finally {
      setMarkingAsRead(null);
    }
  };

  // Navigate to view all notifications
  const handleViewAllNotifications = () => {
    router.push("/dashboard/notifications");
      setIsNotificationOpen(false);
  };



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      // Navigate to global search page that searches across all entities
      router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
    } else {
      // If search is empty, navigate to organization page without search param
      if (pathname?.includes("/organization")) {
        router.push("/dashboard/organization");
      } else {
        router.push("/dashboard/organization");
      }
    }
  };

  const handleSettings = () => {
    router.push("/dashboard/settings");
  };

  const handleLogout = async () => {
    try {
      Cookies.remove("auth_token");
      Cookies.remove("refresh_token");
      Cookies.remove("user");
      toast.success("Logged out successfully", { toastId: "logout-success" });
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout", { toastId: "logout-error" });
    }
  };

  const handleViewProfile = () => {
    router.push("/dashboard/profile");
    setIsProfileOpen(false);
  };

  return (
    <header className="flex items-center justify-between gap-3 md:gap-5 h-auto md:h-[150px] px-4 md:px-[24px] py-4 md:py-12 shadow-[0px_4px_25px_0px_#0000001A]">
      <div className="flex items-center gap-3 flex-1 md:flex-none md:basis-[50%]">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden flex items-center justify-center bg-white w-[40px] h-[40px] rounded-[10px] shadow-[0px_4px_25px_0px_#0000001A] cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-[#003465]" />
          ) : (
            <Menu className="h-5 w-5 text-[#003465]" />
          )}
        </button>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative flex items-center justify-center px-2 py-[10px] rounded-[60px] bg-white shadow-[4px_4px_4px_0px_#B7B5B566] flex-1">
          <input
            type="text"
            placeholder="Search organizations, employees, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-5 h-[50px] rounded-[30px] pl-5 pr-12 bg-[#E4E8F2] outline-none focus:outline-1 focus:outline-slate-400 w-full text-sm md:text-base [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          <button 
            type="submit" 
            className="absolute right-4 md:right-10 cursor-pointer hover:opacity-70 transition-opacity"
            aria-label="Search"
          >
            <SearchIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </form>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        {/* Notifications */}
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <span className="relative flex items-center justify-center bg-white w-[40px] h-[40px] rounded-[10px] shadow-[0px_4px_25px_0px_#0000001A] cursor-pointer hover:bg-gray-50 transition-colors">
              <BellIcon className="h-6 w-6" />
        </span>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => {
                  return (
                  <div
                    key={notification.id}
                    className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[#003465]">
                          {notification.title}
                        </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ""}
                        </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t text-center">
                <button
                  className="text-sm text-[#003465] hover:underline"
                  onClick={handleViewAllNotifications}
                >
                  View all notification
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Notification View Modal */}
        {showNotificationModal && selectedNotification && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={() => {
              setShowNotificationModal(false);
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
                    setShowNotificationModal(false);
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
                    setShowNotificationModal(false);
                    setSelectedNotification(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <span
          onClick={handleSettings}
          className="flex items-center justify-center bg-white w-[40px] h-[40px] rounded-[10px] shadow-[0px_4px_25px_0px_#0000001A] cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <IoSettingsSharp className="w-[24px] h-[24px] text-[#EC0909]" />
        </span>

        {/* Profile */}
        <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-[10.32px] cursor-pointer hover:opacity-80 transition-opacity">
          <span className="block w-[40px] h-[40px] rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={profileImage}
              alt="profile image"
                  width={40}
                  height={40}
              className="aspect-square w-full h-full object-cover"
            />
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#003465] mb-1">
              {isLoading ? "Loading..." : fullName || "-"}
            </p>
            <p className="text-xs font-medium text-[#595959]">{role}</p>
          </div>
        </div>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-0">
            <div className="p-2">
              <button
                onClick={handleViewProfile}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                View Profile
              </button>
              <button
                onClick={handleSettings}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                Settings
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};

interface MainHeaderProps {
  isMobileMenuOpen?: boolean;
  toggleMobileMenu?: () => void;
}

const MainHeader = ({ isMobileMenuOpen, toggleMobileMenu }: MainHeaderProps) => {
  return (
    <Suspense fallback={
      <header className="flex items-center justify-between gap-3 md:gap-5 h-auto md:h-[150px] px-4 md:px-[24px] py-4 md:py-12 shadow-[0px_4px_25px_0px_#0000001A]">
        <div className="flex items-center gap-3 flex-1 md:flex-none md:basis-[50%]">
          <div className="lg:hidden w-[40px] h-[40px] rounded-[10px] bg-gray-200 animate-pulse flex-shrink-0"></div>
          <div className="relative flex items-center justify-center px-2 py-[10px] rounded-[60px] bg-white shadow-[4px_4px_4px_0px_#B7B5B566] flex-1">
            <div className="px-5 h-[50px] rounded-[30px] bg-[#E4E8F2] w-full animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-[40px] h-[40px] rounded-[10px] bg-gray-200 animate-pulse"></div>
          <div className="w-[40px] h-[40px] rounded-[10px] bg-gray-200 animate-pulse"></div>
          <div className="flex items-center gap-[10.32px]">
            <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse"></div>
            <div className="hidden sm:block">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    }>
      <MainHeaderContent isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
    </Suspense>
  );
};

export default MainHeader;
