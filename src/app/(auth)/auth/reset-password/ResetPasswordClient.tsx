"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { processRequestNoAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { EyeOffIcon, EyeClosedIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/icons/Spinner";

type ResetPasswordProps = z.infer<typeof schema>;

const schema = z.object({
  password: z
    .string()
    .min(6)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+}{":;'?/>.<,])(?=.*[a-zA-Z]).{8,}$/,
      {
        message:
          "Password must contain at least one lowercase, uppercase, number and one special character",
      }
    ),
  confirmPassword: z
    .string()
    .min(6)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+}{":;'?/>.<,])(?=.*[a-zA-Z]).{8,}$/,
      {
        message:
          "Password must contain at least one lowercase, uppercase, number and one special character",
      }
    ),
});
const ResetPasswordClient = () => {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();
  useEffect(() => {}, []);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<ResetPasswordProps>({
    resolver: zodResolver(schema),
  });

  const handlePasswordReset = async (data: ResetPasswordProps) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Password does not match");
      return;
    }
    if (!token) {
      toast.error("Please request for a new Otp");
      return;
    }
    try {
      const res = await processRequestNoAuth(
        "post",
        API_ENDPOINTS.RESET_PASSWORD,
        {
          token: token,
          password: data.password,
        }
      );
      console.log("Reset password response:", res);
      
      // Handle the response structure: { success: true, message: "...", data: { ... } }
      if (res && res.success) {
        toast.success(res.message || "Password reset successfully! Redirecting to login...");
        // Add a small delay to show the success message before redirecting
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else if (res && res.status) {
        // Fallback for legacy response format
        toast.success("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        toast.error(res?.message || "Password reset failed. Please try again.");
      }
    } catch (error: any) {
      console.log("Reset password error:", error);
      // Check if error response contains success data (backend might return error status with success body)
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.success) {
          // Backend returned success data but with error status code
          toast.success(errorData.message || "Password reset successfully! Redirecting to login...");
          setTimeout(() => {
            router.push("/auth/login");
          }, 1500);
          return;
        }
        toast.error(errorData.error || errorData.message || "Failed to reset password. Please try again.");
      } else {
        toast.error(error?.message || "Failed to reset password. Please try again.");
      }
    }
  };
  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  return (
    <React.Fragment>
      <div className="font-poppins container grid place-items-center  bg-[#5882C17D] shadow-lg rounded-2xl border border-blue-500 text-white w-full max-w-[350px] md:max-w-[450px] md:px-8 px-8 py-20 ">
        <div className="form flex flex-col items-center justify-center space-y-12">
          <div className="orgDeatails flex flex-col items-center justify-center gap-4">
            <Image
              src="/assets/auth/reset-password.png"
              width={30}
              height={20}
              alt="logo"
              className="logo"
            />
            <h2 className="login font-bold text-2xl md:text-3xl">
              Enter New Password
            </h2>
            <span className="text-base">
              Enter and confirm your new password
            </span>
          </div>
          <form
            action=""
            className="w-full text-white flex flex-col space-y-6"
            onSubmit={handleSubmit(handlePasswordReset)}
          >
            <div className="grid gap-[6px]">
              <label htmlFor="new-password" className="text-sm ">
                Password
              </label>
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                icon={
                  showPassword ? (
                    <EyeOffIcon
                      className="size-5"
                      onClick={handleShowPassword}
                    />
                  ) : (
                    <EyeClosedIcon
                      className="size-5"
                      onClick={handleShowPassword}
                    />
                  )
                }
                error={errors.password?.message}
                placeholder="Enter New Password"
                className="text-gray-700"
              />
            </div>
            <div className="grid gap-[6px]">
              <label htmlFor="confirm-password" className="text-sm ">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword")}
                icon={
                  showPassword ? (
                    <EyeOffIcon
                      className="size-5"
                      onClick={handleShowPassword}
                    />
                  ) : (
                    <EyeClosedIcon
                      className="size-5"
                      onClick={handleShowPassword}
                    />
                  )
                }
                error={errors.confirmPassword?.message}
                placeholder="Confirm Password"
                className="text-gray-400"
              />
            </div>
            <Button
              className="font-medium text-md mt-3 bg-[#003465]"
              type="submit"
            >
              {isSubmitting ? <Spinner /> : "Submit"}
            </Button>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPasswordClient;
