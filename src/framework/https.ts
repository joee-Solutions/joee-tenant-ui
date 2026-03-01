import { siteConfig } from "@/framework/site-config";
import axios from "axios";
import { getRefreshToken, getToken, isTokenExpiredOrExpiringSoon } from "./get-token";
import Cookies from "js-cookie";
import { API_ENDPOINTS } from "./api-endpoints";

let httpNoAuth: any;
let refreshingToking = false;
let redirectingToLogin = false; // Flag to prevent multiple redirects
let controller = new AbortController();

export const resetController = () => {
  controller.abort();
  controller = new AbortController(); // reassign
};

// Reset the redirecting flag (call this after successful login)
export const resetRedirectFlag = () => {
  redirectingToLogin = false;
};
console.log("siteConfig.siteUrl-->", siteConfig.siteUrl);
if (typeof window !== undefined) {
  httpNoAuth = axios.create({
    baseURL: siteConfig.siteUrl,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}
httpNoAuth.interceptors.request.use(
  (config) => {
    config.headers = {
      ...config.headers,
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let httpAuth: any;
if (typeof window !== undefined) {
  httpAuth = axios.create({
    baseURL: siteConfig.siteUrl,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}
httpAuth.interceptors.request.use(
  async (config) => {
    let token = getToken();

    // Proactively refresh if token is expired or expiring soon (before we use it)
    const refreshToken = getRefreshToken();
    if (
      token &&
      refreshToken &&
      isTokenExpiredOrExpiringSoon(token) &&
      !refreshingToking &&
      !redirectingToLogin
    ) {
      try {
        const refreshed = await refreshUser();
        if (refreshed) {
          token = getToken();
        }
      } catch (e) {
        // refreshUser handles redirect; continue with request so 401 path can run if needed
      }
    }

    let authorization;
    if (typeof token === "string" && token.trim().length > 10) {
      authorization = `Bearer ${token}`;
    }
    // attach tenant header if available (for tenant-scoped endpoints guarded by TenantDomainMiddleware)
    let tenantDomain: string | undefined;
    try {
      // try to infer from current org route cache
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      const parts = path.split("/");
      // path looks like: /dashboard/organization/[org]/...
      const orgSlug = parts.length > 4 ? parts[3] : undefined;
      if (orgSlug) {
        const stored = localStorage.getItem(`orgDomain:${orgSlug}`);
        if (stored) tenantDomain = stored;
      }
    } catch {}

    // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
    const isFormData = config.data instanceof FormData;
    const headers: any = {
      ...config.headers,
      ...(authorization ? { authorization } : {}),
      ...(tenantDomain ? { "x-tenant-id": tenantDomain } : {}),
    };
    
    // Remove Content-Type for FormData - axios will set it with boundary automatically
    if (isFormData) {
      delete headers['Content-Type'];
    }

    config.headers = headers;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const processRequestNoAuth = async (
  method: "post" | "get" | "put" | "delete",
  path: string,
  data?,
  callback?: (path: string, data: any, error?: any) => void,
  files?: any[]
) => {
  console.debug("request -> processDataRequest", path);

  let rt;
  //   if (isNotEmpty(files)) {
  //     data = convertToFormData(data, files)
  //     httpNoAuth.defaults.headers['Content-Type'] = 'multipart/form-data';
  //     method = 'post';
  //   }
  try {
    if (method === "post") {
      rt = await httpNoAuth.post(`/api${path}`, data);
    } else if (method === "get") {
      rt = await httpNoAuth.get(`/api${path}`, {
        signal: controller.signal,
      });
    } else if (method === "put") {
      rt = await httpNoAuth.put(`/api${path}`, data);
    } else if (method === "delete") {
      // Keep DELETE consistent with other verbs – backend expects /api-prefixed paths
      rt = await httpNoAuth.delete(`/api${path}`);
    } else {
      throw new Error(`Invalid method, method:${method} path:${path}`);
    }

    if (callback) {
      callback(path, rt.data);
    }

    return rt.data;
  } catch (error) {
    console.log(error);
    if (callback) {
      callback(path, null, error);
    } else {
      throw error;
    }
  }
};

const processRequestAuth = async (
  method,
  path,
  data?,
  callback?: (path: string, data: any, error?: any) => void,
  files?: any[]
) => {
  console.debug("request -> processDataRequest", path);

  // Check offline status first (only in browser environment)
  if (typeof window !== 'undefined') {
    const { offlineService } = await import('@/lib/offline/offlineService');
    const { offlineLogger } = await import('@/lib/offline/offlineLogger');
    
    // Always check online status before making requests
    if (!offlineService.getOnlineStatus()) {
      offlineLogger.info(`Intercepted ${method.toUpperCase()} request - routing to offline service`, { path });
      // Use offline service for all requests when offline
      return await offlineService.makeRequest(method, path, data);
    }
    // If online, continue with normal flow
    offlineLogger.debug(`Processing ${method.toUpperCase()} request normally (online)`, { path });
  }

  let rt;
  // if (isNotEmpty(files)) {
  //   data = convertToFormData(data, files)
  //   httpAuth.defaults.headers['Content-Type'] = 'multipart/form-data';
  //   method = 'post';
  // }

  try {
    // Check if data is FormData
    // When using FormData, DO NOT set Content-Type header manually
    // Axios will automatically set it with the correct boundary
    const isFormData = data instanceof FormData;
    const config = isFormData ? {} : {}; // Empty config for FormData - let axios handle headers
    
    if (method === "post") {
      rt = await httpAuth.post(`/api${path}`, data, config);
    } else if (method === "get") {
      rt = await httpAuth.get(`/api${path}`, {
        signal: controller.signal,
      });
    } else if (method === "put") {
      rt = await httpAuth.put(`/api${path}`, data, config);
    } else if (method === "patch") {
      rt = await httpAuth.patch(`/api${path}`, data, config);
    } else if (method === "delete") {
      // Keep DELETE consistent with other verbs – backend expects /api-prefixed paths
      rt = await httpAuth.delete(`/api${path}`);
    } else {
      throw new Error(`Invalid method, method:${method} path:${path}`);
    }

    if (callback) {
      callback(path, rt.data);
    }
    
    // Cache GET responses for offline use (only in browser environment)
    // This ensures ALL pages visited are cached, even if not pre-cached
    if (typeof window !== 'undefined' && method === 'get') {
      try {
        const { offlineService } = await import('@/lib/offline/offlineService');
        const { offlineLogger } = await import('@/lib/offline/offlineLogger');
        // Cache the response for offline access
        await offlineService.cacheResponse(path, rt.data);
        offlineLogger.debug(`Cached GET response in normal flow: ${path}`);
        
        // Also try to cache individual items from list responses
        // This helps build up the cache incrementally
        try {
          const { preCacheService } = await import('@/lib/offline/preCacheService');
          // Extract tenant ID from path if available
          const tenantMatch = path.match(/\/tenants\/(\d+)/);
          const tenantId = tenantMatch ? parseInt(tenantMatch[1], 10) : undefined;
          await preCacheService.cacheIndividualItemsFromList(path, rt.data, tenantId);
        } catch (error) {
          // Silently fail - not critical
        }
      } catch (error) {
        // Silently fail caching - don't break the request
        console.warn('Failed to cache response:', error);
      }
    }
    
    // console.log(rt.data, "rt.data");
    return rt.data;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const errorMessage = error?.response?.data?.error?.toLowerCase() || error?.message?.toLowerCase() || "";
    const isUnauthorized = statusCode === 401 || errorMessage.includes("not authorized") || errorMessage.includes("unauthorized");
    
    // Only attempt refresh if we haven't already tried and it's an auth error
    // Also check if we're already redirecting to prevent loops
    if (!refreshingToking && !redirectingToLogin && isUnauthorized) {
      const refreshed = await refreshUser();
      if (refreshed) {
        // Retry the original request with new token
        try {
          return await processRequestAuth(method, path, data, callback);
        } catch (retryError) {
          // If retry also fails, don't try to refresh again
          console.error("Request failed after token refresh:", retryError);
          if (callback) {
            callback(path, null, retryError);
          } else {
            throw retryError;
          }
        }
      } else {
        // Refresh failed or no refresh token - clear session and redirect to login (only once)
        if (!redirectingToLogin && typeof window !== "undefined") {
          redirectingToLogin = true;
          Cookies.remove("refresh_token");
          Cookies.remove("auth_token");
          Cookies.remove("customer");
          Cookies.remove("user");
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith("/auth/login")) {
            window.location.href = "/auth/login";
          }
        }
        if (callback) {
          callback(path, null, error);
        } else {
          throw error;
        }
        return null;
      }
    } else if (redirectingToLogin) {
      // If we're already redirecting, don't process the error further
      if (callback) {
        callback(path, null, error);
      }
      return null;
    }

    console.error("API request error:", error);
    if (callback) {
      callback(path, null, error);
    } else {
      throw error;
    }
  }
};

const refreshUser = async () => {
  // Prevent multiple simultaneous refresh attempts
  if (refreshingToking) {
    console.log("Token refresh already in progress, waiting...");
    // Wait for the ongoing refresh to complete
    let waitCount = 0;
    while (refreshingToking && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    // Check if we got a token while waiting
    const token = getToken();
    if (token && typeof token === "string" && token.trim().length > 10) {
      return { token };
    }
    return null;
  }

  // Prevent redirect loops
  if (redirectingToLogin) {
    console.log("Already redirecting to login, skipping refresh");
    return null;
  }

    // Only refresh when we have a refresh token; without it we skip refresh and let the request use the current token.
  // If the server returns 401, the 401 handler will clear and redirect (don't clear here - avoids logging out when API doesn't send refresh token).
  console.log("Refreshing access token before it expires");
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.log("No refresh token available - skipping refresh, request will use current token");
      return null;
    }

    refreshingToking = true;
    
    try {
      // POST /auth/super/refresh with body { refresh_token } returns { success, message, data: { access_token, expires_in } }
      const tResponse: any = await processRequestNoAuth(
        "post",
        API_ENDPOINTS.REFRESH_TOKEN,
        { refresh_token: refreshToken }
      );
      
      // Canonical format: { success, message, data: { access_token, expires_in } }. Also handle double-nested or other shapes.
      const newToken =
        tResponse?.data?.access_token ||
        tResponse?.data?.data?.access_token ||
        tResponse?.data?.tokens?.accessToken ||
        tResponse?.data?.accessToken ||
        tResponse?.tokens?.accessToken ||
        tResponse?.tokens?.access_token ||
        tResponse?.accessToken ||
        tResponse?.access_token ||
        tResponse?.token ||
        tResponse?.data?.token;

      const userData = tResponse?.data?.user || tResponse?.user;

      if (newToken) {
        // Set token to expire in 1 day (instead of 30 minutes)
        Cookies.set("auth_token", newToken, { expires: 1 });

        // Update refresh token if provided in response
        const newRefreshToken =
          tResponse?.data?.tokens?.refreshToken ||
          tResponse?.data?.refreshToken ||
          tResponse?.tokens?.refreshToken ||
          tResponse?.tokens?.refresh_token ||
          tResponse?.refreshToken ||
          tResponse?.refresh_token ||
          tResponse?.data?.refresh_token;
        
        if (newRefreshToken) {
          Cookies.set("refresh_token", newRefreshToken, { expires: 7 });
        }
        
        if (userData) {
          Cookies.set("customer", JSON.stringify(userData), {
            expires: 1,
          });
          Cookies.set("user", JSON.stringify(userData), {
            expires: 1,
          });
        }
        
        console.log("Token refreshed successfully");
        refreshingToking = false;
        return tResponse;
      } else {
        console.warn("Refresh token response missing token. Response structure:", JSON.stringify(tResponse, null, 2));
        refreshingToking = false;
        throw new Error("Invalid refresh token response");
      }
    } catch (error: any) {
      console.error("Token refresh failed:", error);
      
      // Handle 404 or other errors - clear tokens and redirect to login
      const statusCode = error?.response?.status || error?.statusCode;
      const is404 = statusCode === 404;
      const is401 = statusCode === 401;
      const is400 = statusCode === 400;
      
      // If endpoint doesn't exist (404) or token is invalid (401/400), clear everything
      if (is404 || is401 || is400) {
        console.log("Refresh token endpoint error or invalid token, clearing session");
        
        // Only redirect once to prevent loops
        if (!redirectingToLogin) {
          redirectingToLogin = true;
          Cookies.remove("refresh_token");
          Cookies.remove("auth_token");
          Cookies.remove("customer");
          Cookies.remove("user");
          
          // Redirect to login after a short delay to allow cleanup
          // Only redirect if we're not already on the login page
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith("/auth/login")) {
              setTimeout(() => {
                window.location.href = "/auth/login";
              }, 100);
            } else {
              // If already on login page, just reset the flag after a delay
              setTimeout(() => {
                redirectingToLogin = false;
              }, 1000);
            }
          }
        }
      }
      
      return null;
    }
  } catch (error: any) {
    // Handle any unexpected errors in the outer try block
    console.error("Unexpected error in refreshUser:", error);
    refreshingToking = false;
    return null;
  } finally {
    refreshingToking = false;
  }
};

export const convertToFormData = (data, files) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  if (Array.isArray(files)) {
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });
  } else if (typeof files === "object") {
    Object.keys(files).forEach((key) => {
      let keyFiles = Array.isArray(files[key]) ? files[key] : [files[key]];
      keyFiles.forEach((file, index) => {
        formData.append(`${key}${index}`, file);
      });
    });
  } else if (files.constructor.name === "File") {
    formData.append(`file`, files);
  }

  return formData;
};

export {
  httpAuth,
  httpNoAuth,
  refreshUser,
  processRequestAuth,
  processRequestNoAuth,
};

/**
 * Diagnostic function to check authentication status
 * Call this from browser console: window.checkAuthStatus()
 */
if (typeof window !== 'undefined') {
  (window as any).checkAuthStatus = () => {
    console.log('=== AUTHENTICATION STATUS DIAGNOSTIC ===');
    const token = getToken();
    const refreshToken = getRefreshToken();
    const user = Cookies.get('user');
    
    console.log('Auth Token:', token ? `${token.substring(0, 20)}...` : 'NOT SET');
    console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NOT SET');
    console.log('User Cookie:', user ? 'SET' : 'NOT SET');
    
    if (token) {
      try {
        // Try to decode JWT to see expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expDate = new Date(payload.exp * 1000);
        console.log('Token expires at:', expDate.toISOString());
        console.log('Token is expired:', new Date() > expDate);
        console.log('Time until expiration:', Math.round((expDate.getTime() - Date.now()) / 1000 / 60), 'minutes');
      } catch (e) {
        console.log('Could not decode token');
      }
    }
    
    console.log('=== END DIAGNOSTIC ===');
  };
}
