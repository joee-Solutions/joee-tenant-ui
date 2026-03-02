"use client";
import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();
  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) {
      router.push("/auth/login");
    } else {
      router.push("/dashboard");
    }
  }, [router]);
  return null;
};

export default HomePage;
