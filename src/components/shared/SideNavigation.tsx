"use client";
import { sideNavigation } from "@/utils/navigation";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SideNavigationProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (isOpen: boolean) => void;
}

const SideNavigation = ({ isMobileMenuOpen, setIsMobileMenuOpen }: SideNavigationProps) => {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      // Get user email before clearing cookies
      const userCookie = Cookies.get('user');
      let userEmail: string | undefined;
      
      if (userCookie) {
        try {
          const user = JSON.parse(userCookie);
          userEmail = user.email;
        } catch (error) {
          // Ignore parse errors
        }
      }

      // Logout works offline - just clears cookies and localStorage
      Cookies.remove("auth_token");
      Cookies.remove("refresh_token");
      Cookies.remove("user");
      Cookies.remove("mfa_token");
      
      // Note: We keep offline credentials even after logout
      // This allows users to login offline again later
      // Credentials will expire after 7 days automatically
      // If you want to clear credentials, use: offlineAuthService.clearCredentials(userEmail, false)
      
      // Clear offline pre-cache status
      if (typeof window !== 'undefined') {
        localStorage.removeItem('offline_precache_completed');
        localStorage.removeItem('offline_precache_timestamp');
        localStorage.removeItem('offline_precache_stats');
      }
      router.push("/auth/login");
    } catch (error) {
      console.log("Logout error:", error);
      // Even if there's an error, try to clear cookies and redirect
      Cookies.remove("auth_token");
      Cookies.remove("refresh_token");
      Cookies.remove("user");
      Cookies.remove("mfa_token");
      router.push("/auth/login");
    }
  };
  const pathName = usePathname();
  const isPathNameMatch = (path: string) => {
    return pathName === path;
  };
  return (
    <div className="fixed w-72 bg-[#003465] overflow-y-auto z-[100] min-h-screen inset-y-0">
      {/* Close button - visible only on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen?.(false)}
        className="lg:hidden absolute top-4 right-4 z-[110] flex items-center justify-center bg-white/10 hover:bg-white/20 text-white w-[36px] h-[36px] rounded-lg transition-colors"
        aria-label="Close menu"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="text-white py-12 flex flex-col items-center justify-center gap-2">
        <Image
          width={200}
          height={200}
          src="/assets/logo/logo.png"
          alt=""
          className="w-16 h-16"
          priority
        />
        <p>LociCare by Joee</p>
      </div>
      <div className="border-b border-white"></div>
      {sideNavigation.map((item, index) => (
        <div key={item.name} className="w-full">
          {item.showRuler && <div className="border-b border-white"></div>}
          <div className={cn("flex flex-col items-start gap-4  py-6 w-full")}>
            {item.isTitle ? (
              <p className="text-[#E6E6E6] flex gap-3 uppercase pl-16">
                {item.name}
              </p>
            ) : (
              item.href && (
                <div
                  className={cn(
                    " w-full",
                    isPathNameMatch(item.href) ? "pl-8" : "pl-16"
                  )}
                >
                  <Link
                    className={cn(
                      "text-white flex gap-3 uppercase w-full py-4 items-center",
                      isPathNameMatch(item.href)
                        ? "text-black bg-white rounded-l-full pl-8"
                        : ""
                    )}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen?.(false)}
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
                </div>
              )
            )}
            <div className="flex flex-col w-full">
              {item.children &&
                item.children.map((child) => {
                  return (
                    <div key={child.title} className="py-1  w-full">
                      <div className="flex   gap-1">
                        {!child.href ? (
                          <button
                            className="capitalize whitespace-nowrap pl-16 text-white flex gap-3"
                            onClick={handleLogout}
                          >
                            {child.icon && (
                              <child.icon className="text-white h-5 w-5" />
                            )}
                            {child.title}
                          </button>
                        ) : (
                          <div
                            className={cn(
                              "pl-16 w-full",
                              isPathNameMatch(child.href) ? "pl-8" : ""
                            )}
                          >
                            <Link
                              href={child.href}
                              className={cn(
                                `capitalize whitespace-nowrap text-white items-center w-full flex gap-3 py-4`,
                                isPathNameMatch(child.href)
                                  ? "text-black  bg-white  rounded-l-full pl-8"
                                  : ""
                              )}
                              onClick={() => setIsMobileMenuOpen?.(false)}
                            >
                              {child.icon && (
                                <child.icon
                                  className={cn(
                                    "text-white h-5 w-5 relative z-10 ",
                                    isPathNameMatch(child.href)
                                      ? " text-[#0085FF]"
                                      : ""
                                  )}
                                />
                              )}
                              {child.title}
                              {isPathNameMatch(child.href) && (
                                <span className="bg-black  h-1.5 w-1.5 rounded-full"></span>
                              )}
                            </Link>
                          </div>
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
