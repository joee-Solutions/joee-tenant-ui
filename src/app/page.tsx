"use client";
import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();
  const handleLogout = async () => {
    console.log("logout");
    // Logout works offline - just clears cookies
    // Note: Offline credentials are kept for future offline login (expire after 7 days)
    Cookies.remove("auth_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user");
    Cookies.remove("mfa_token");
    // Clear any offline-related data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('offline_precache_completed');
    }
    router.push("/auth/login");
  };
  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) {
      router.push("/auth/login");
    } else {
      router.push("/dashboard");
    }
  }, [router]);
  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default HomePage;
