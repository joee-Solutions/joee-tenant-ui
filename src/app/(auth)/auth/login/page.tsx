"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOffIcon, EyeClosedIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { processRequestNoAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { Spinner } from "@/components/icons/Spinner";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTenantStore } from "@/contexts/AuthProvider";
import { getToken } from "@/framework/get-token";
import { offlineAuthService } from "@/lib/offline/offlineAuth";

type LoginProps = z.infer<typeof schema>;

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  // password must contain a lowercase, uppercase letter, a number and a special character but must be validated seperately
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+}{":;'?/>.<,])(?=.*[a-zA-Z]).{8,}$/,
      {
        message:
          "Password must contain at least one lowercase, uppercase, number and one special character",
      }
    ),
});

const TenantLoginPage = () => {
  const router = useRouter();
  const { setUser } = useTenantStore(state => state.actions);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errMessage, setErrMessage] = useState<string>("");
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    setError,
  } = useForm<LoginProps>({
    resolver: zodResolver(schema),
    // reValidateMode: "onChange",
  });

  // Check if device is offline
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Check if user has valid token and redirect to dashboard (works offline)
  useEffect(() => {
    const token = getToken();
    const userCookie = Cookies.get('user');
    
    if (token && userCookie) {
      try {
        const user = JSON.parse(userCookie);
        setUser(user);
        router.push("/dashboard");
      } catch (error) {
        // Invalid user data, continue with login
      }
    }
  }, [router, setUser]);

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  
  const handleFormSubmit = async (data: LoginProps) => {
    // Check if offline - try offline login first
    if (isOffline || !navigator.onLine) {
      try {
        // Attempt offline login using cached credentials
        const offlineResult = await offlineAuthService.verifyCredentialsOffline(
          data.email,
          data.password
        );

        if (offlineResult.success && offlineResult.token && offlineResult.userData) {
          // Offline login successful
          Cookies.set("auth_token", offlineResult.token, { expires: 1 });
          Cookies.set("user", JSON.stringify(offlineResult.userData), { expires: 1 });
          setUser(offlineResult.userData);
          
          toast.success("Offline login successful", { toastId: "offline-login-success" });
          router.push("/dashboard");
          return;
        } else {
          // No cached credentials or invalid
          toast.error(
            "No offline credentials found. Please login while online first to enable offline login.",
            {
              toastId: "offline-login-error",
              autoClose: 5000,
            }
          );
          return;
        }
      } catch (error: any) {
        toast.error("Offline login failed. Please check your credentials or login while online.", {
          toastId: "offline-login-error",
        });
        return;
      }
    }

    // Online login
    try {
      const rt = await processRequestNoAuth("post", API_ENDPOINTS.LOGIN, data);
      console.log("Login response:", rt);
      if (rt) {
        // Extract token from response - prioritize the nested data structure
        // Response structure: { success, message, data: { tokens: { accessToken, refreshToken }, user } }
        const authToken = 
          rt.data?.tokens?.accessToken ||  // Primary path: nested in data.tokens
          rt.tokens?.accessToken ||        // Fallback: direct tokens
          rt.token || 
          rt.data?.token || 
          rt.auth_token || 
          rt.data?.auth_token;
        
        console.log("Extracted auth token:", authToken ? "Found" : "Not found");
        
        if (authToken) {
          // Set auth_token cookie
          Cookies.set("auth_token", authToken, { expires: 1 });
          
          // Store refresh token if available - prioritize nested structure
          const refreshToken = 
            rt.data?.tokens?.refreshToken ||  // Primary path: nested in data.tokens
            rt.tokens?.refreshToken ||        // Fallback: direct tokens
            rt.refreshToken || 
            rt.data?.refreshToken;
          
          if (refreshToken) {
            Cookies.set("refresh_token", refreshToken, { expires: 7 });
          }
          
          // Remove mfa_token if it exists (no longer needed)
          Cookies.remove("mfa_token");
          
          // Set user data if available in login response - prioritize nested structure
          const userData = rt.data?.user || rt.user;
          if (userData) {
            Cookies.set("user", JSON.stringify(userData), { expires: 1 });
            setUser(userData);
          }
          
          // Store credentials for offline login (encrypted)
          // This is optional - login should succeed even if offline storage fails
          try {
            await offlineAuthService.storeCredentials(
              data.email,
              data.password,
              authToken,
              userData
            );
            
            // Verify credentials were stored
            const hasCredentials = await offlineAuthService.hasOfflineCredentials(data.email);
            if (hasCredentials) {
              console.log('✅ Offline credentials verified and stored successfully');
            } else {
              console.warn('⚠️ Offline credentials storage may have failed - verification returned false');
            }
          } catch (offlineError) {
            // Log but don't block login - offline credentials are optional
            console.error("❌ Failed to store offline credentials (login will continue):", offlineError);
            // Show a non-blocking warning to user
            toast.warn("Offline login may not be available. Credentials could not be saved.", {
              toastId: "offline-credentials-warning",
              autoClose: 3000,
            });
          }
          
          // Reset redirect flag after successful login
          const { resetRedirectFlag } = await import("@/framework/https");
          resetRedirectFlag();
          
          toast.success("Login successful", { toastId: "login-success" });
          router.push("/dashboard");
        } else {
          // If no token is available, show error
          console.error("Login response structure:", JSON.stringify(rt, null, 2));
          toast.error("Login failed: No authentication token received");
        }
      }
    } catch (error: any) {
      // Check if error is due to offline
      if (!navigator.onLine || isOffline) {
        // Try offline login as fallback
        try {
          const offlineResult = await offlineAuthService.verifyCredentialsOffline(
            data.email,
            data.password
          );

          if (offlineResult.success && offlineResult.token && offlineResult.userData) {
            Cookies.set("auth_token", offlineResult.token, { expires: 1 });
            Cookies.set("user", JSON.stringify(offlineResult.userData), { expires: 1 });
            setUser(offlineResult.userData);
            
            toast.success("Offline login successful", { toastId: "offline-login-success" });
            router.push("/dashboard");
            return;
          }
        } catch (offlineError) {
          // Fall through to show error
        }
        
        toast.error("Login requires internet connection. Please check your network and try again.", {
          toastId: "offline-login-error",
        });
      } else {
        toast.error(error?.response?.data?.error || "Login failed");
        if (error?.status === 401) {
          setErrMessage(error?.response?.data?.error);
        }
      }
    }
  };

  useEffect(() => {
    if (errMessage.toLowerCase().includes("user")) {
      setError("email", {
        type: "manual",
        message: errMessage,
      });
    } else if (errMessage.toLowerCase().includes("password")) {
      setError("password", {
        type: "manual",
        message: errMessage,
      });
    }
  }, [errMessage]);
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-8 lg:px-24 py-10 items-center justify-center font-poppins place-items-center">
      <div className="content col-span-1 text-white hidden md:flex flex-col justify-center space-y-8 w-full max-w-3xl">
        <h1 className="header font-bold text-4xl md:text-6xl lg:text-6xl leading-tight">
          Welcome to LoCiCare
        </h1>
        <div className="line border-2 border-white w-32 md:w-40"></div>
        <div className="line border-3 border-white"></div>
        <span className="welcom md:w-3/4 text-base md:text-lg leading-7 md:leading-8">
          Empowering Missions. Strengthening Communities. Together, we connect people, data, and care driving innovation...
        </span>
      </div>
      <div className="col-span-1 shadow-lg rounded-2xl  border border-blue-500 text-white z-40 w-full max-w-[350px] md:max-w-[550px] md:px-8 px-8 py-20 [linear-gradient:rgb()] bg-[#5882C147]">
        <div className="form flex flex-col px-12 md:px-20  items-center justify-center space-y-4  ">
          <div className="orgDeatails flex flex-col items-center justify-center gap-4">
            <Image
              alt="logo"
              src="/assets/auth/otp.png"
              width={80}
              height={60}
              className="logo"
            />
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-medium text-2xl md:text-3xl">
                LociCare
              </span>
              <span className="text-lg md:text-xl whitespace-nowrap">by JOEE Solutions</span>
            </span>
          </div>
          <form
            action=""
            className="grid w-full text-white"
            onSubmit={handleSubmit(handleFormSubmit)}
          >
            <div className="grid gap-[6px] mb-7">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="login-email"
                placeholder="username@gmail.com"
                type="email"
                {...register("email")}
                className="text-gray-700"
                error={errors.email?.message}
              />
            </div>
            <div className="grid gap-[6px] mb-3">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="login-password"
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
                placeholder="Enter Password"
                error={errors.password?.message}
                className="text-gray-700"
              />
            </div>
            <div className="extra-details flex justify-between text-xs md:text-sm mb-7">
              <Link
                href={"/auth/forgot-password"}
                className="text-[#FAD900] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            {isOffline && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Offline Mode:</strong> You can login using previously saved credentials. 
                  If you haven't logged in online before, please connect to the internet first.
                </p>
              </div>
            )}
            <Button
              className="font-medium mb-3 bg-[#003465]"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner /> : isOffline ? "Login Offline" : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantLoginPage;
