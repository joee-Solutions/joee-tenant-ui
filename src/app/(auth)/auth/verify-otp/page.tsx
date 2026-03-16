"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import VerifyOtpLoginClient from "./VerifyLoginOtp";
import { getMfaToken } from "@/framework/get-token";

const VerifyOTP = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const t = getMfaToken();
    if (!t) {
      router.replace("/auth/login");
      return;
    }
    setToken(t);
  }, [router]);

  if (!token) return null;

  return <VerifyOtpLoginClient token={token} />;
};

export default VerifyOTP;
