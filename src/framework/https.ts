import { siteConfig } from "@/framework/site-config";
import axios from "axios";
import { getRefreshToken, getToken } from "./get-token";
import Cookies from "js-cookie";
import { API_ENDPOINTS } from "./api-endpoints";

let httpNoAuth: any;
let refreshingToking = false;
let controller = new AbortController();

export const resetController = () => {
  controller.abort();
  controller = new AbortController(); // reassign
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
  (config) => {
    const token = getToken();
    let authorization;
    if (typeof token === "string" && token.trim().length > 10) {
      authorization = `Bearer ${token}`;
    } else {
      const refreshed = getRefreshToken();
      if (refreshed) {
        const token = getToken();
        if (typeof token === "string" && token.trim().length > 10) {
          authorization = `Bearer ${token}`;
        }
      } else {
        window.location.href = "/auth/login";
        return;
      }
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

    config.headers = {
      ...config.headers,
      authorization,
      ...(tenantDomain ? { "x-tenant-id": tenantDomain } : {}),
    };
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
    if (!refreshingToking && isUnauthorized) {
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
        // Refresh failed - tokens are cleared and user should be redirected
        // Don't throw error here as redirect is happening
        if (callback) {
          callback(path, null, error);
        } else {
          throw error;
        }
        return;
      }
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
  console.log("token expired, refreshing token");
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.log("No refresh token available");
      // Clear all tokens and redirect to login
      Cookies.remove("refresh_token");
      Cookies.remove("auth_token");
      Cookies.remove("customer");
      Cookies.remove("user");
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      return null;
    }

    refreshingToking = true;
    
    try {
      const tResponse: any = await processRequestNoAuth(
        "post",
        API_ENDPOINTS.REFRESH_TOKEN,
        { refresh_token: refreshToken }
      );
      
      // Check if response has token (handle different response structures)
      const newToken = tResponse?.token || tResponse?.data?.token || tResponse?.tokens?.accessToken || tResponse?.data?.tokens?.accessToken;
      const userData = tResponse?.user || tResponse?.data?.user;
      
      if (newToken) {
        Cookies.set("auth_token", newToken, { expires: 1 / 48 });
        
        // Update refresh token if provided in response
        const newRefreshToken = tResponse?.refreshToken || tResponse?.data?.refreshToken || tResponse?.tokens?.refreshToken || tResponse?.data?.tokens?.refreshToken;
        if (newRefreshToken) {
          Cookies.set("refresh_token", newRefreshToken, { expires: 7 });
        }
        
        if (userData) {
          Cookies.set("customer", JSON.stringify(userData), {
            expires: 1 / 48,
          });
          Cookies.set("user", JSON.stringify(userData), {
            expires: 1 / 48,
          });
        }
        
        console.log("Token refreshed successfully");
        return tResponse;
      } else {
        console.warn("Refresh token response missing token");
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
        Cookies.remove("refresh_token");
        Cookies.remove("auth_token");
        Cookies.remove("customer");
        Cookies.remove("user");
        
        // Redirect to login after a short delay to allow cleanup
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 100);
        }
      }
      
      return null;
    }
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
