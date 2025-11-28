'use client'
import { useState, useEffect, Suspense } from "react";
import { IoSettingsSharp } from "react-icons/io5";
import { SearchIcon } from "lucide-react";
import { BellIcon } from "../icons/icon";
import Image from "next/image";
import profileImage from "./../../../public/assets/profile.png";
import { useAdminProfile } from "@/hooks/swr";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "react-toastify";

const MainHeaderContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
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

  // Mock notifications data - replace with actual API call
  const notifications = [
    { id: 1, title: "New employee added", message: "John Doe has been added to the system", time: "2 hours ago", read: false },
    { id: 2, title: "Organization updated", message: "ABC Hospital details have been updated", time: "5 hours ago", read: false },
    { id: 3, title: "System maintenance", message: "Scheduled maintenance on Dec 25, 2024", time: "1 day ago", read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      // Navigate to organizations page with search query
      // The organizations page will handle the search using the search parameter
      router.push(`/dashboard/organization?search=${encodeURIComponent(query)}`);
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
    <header className="flex items-center justify-between gap-5 h-[150px] px-[24px] py-12 shadow-[0px_4px_25px_0px_#0000001A]">
      <form onSubmit={handleSearch} className="relative flex items-center justify-center px-2 py-[10px] rounded-[60px] bg-white shadow-[4px_4px_4px_0px_#B7B5B566] basis-[50%]">
        <input
          type="text"
          placeholder="Search organizations, employees, departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-5 h-[50px] rounded-[30px] pl-5 pr-12 bg-[#E4E8F2] outline-none focus:outline-1 focus:outline-slate-400 w-full [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />
        <button 
          type="submit" 
          className="absolute right-10 cursor-pointer hover:opacity-70 transition-opacity"
          aria-label="Search"
        >
          <SearchIcon className="w-5 h-5" />
        </button>
      </form>
      
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <span className="relative flex items-center justify-center bg-white w-[40px] h-[40px] rounded-[10px] shadow-[0px_4px_25px_0px_#0000001A] cursor-pointer hover:bg-gray-50 transition-colors">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
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
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      // Handle notification click
                      console.log("Notification clicked:", notification.id);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[#003465]">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t text-center">
                <button
                  className="text-sm text-[#003465] hover:underline"
                  onClick={() => {
                    // Mark all as read
                    console.log("Mark all as read");
                    setIsNotificationOpen(false);
                  }}
                >
                  Mark all as read
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

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
          <span className="block w-[40px] h-[40px] rounded-full overflow-hidden">
            <Image
              src={profileImage}
              alt="profile image"
                  width={40}
                  height={40}
              className="aspect-square w-full h-full object-cover"
            />
          </span>
          <div>
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

const MainHeader = () => {
  return (
    <Suspense fallback={
      <header className="flex items-center justify-between gap-5 h-[150px] px-[24px] py-12 shadow-[0px_4px_25px_0px_#0000001A]">
        <div className="relative flex items-center justify-center px-2 py-[10px] rounded-[60px] bg-white shadow-[4px_4px_4px_0px_#B7B5B566] basis-[50%]">
          <div className="px-5 h-[50px] rounded-[30px] bg-[#E4E8F2] w-full animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-[10px] bg-gray-200 animate-pulse"></div>
          <div className="w-[40px] h-[40px] rounded-[10px] bg-gray-200 animate-pulse"></div>
          <div className="flex items-center gap-[10.32px]">
            <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse"></div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    }>
      <MainHeaderContent />
    </Suspense>
  );
};

export default MainHeader;
