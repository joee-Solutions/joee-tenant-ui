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
      rt = await httpNoAuth.delete(path);
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

  let rt;
  // if (isNotEmpty(files)) {
  //   data = convertToFormData(data, files)
  //   httpAuth.defaults.headers['Content-Type'] = 'multipart/form-data';
  //   method = 'post';
  // }

  try {
    if (method === "post") {
      rt = await httpAuth.post(`/api${path}`, data);
    } else if (method === "get") {
      rt = await httpAuth.get(`/api${path}`, {
        signal: controller.signal,
      });
    } else if (method === "put") {
      rt = await httpAuth.put(`/api${path}`, data);
    } else if (method === "delete") {
      rt = await httpAuth.delete(path);
    } else {
      throw new Error(`Invalid method, method:${method} path:${path}`);
    }

    if (callback) {
      callback(path, rt.data);
    }
    // console.log(rt.data, "rt.data");
    return rt.data;
  } catch (error: any) {
    if (!refreshingToking && error?.response?.status === 401) {
      const refreshed = await refreshUser();
      if (refreshed) {
        return await processRequestAuth(method, path, data, callback);
      }
    } else if (
      !refreshingToking &&
      error.response?.data?.error?.toLowerCase().includes("not authorized")
    ) {
      const refreshed = await refreshUser();
      if (refreshed) {
        return await processRequestAuth(method, path, data, callback);
      }
    }

    console.error(error);
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
    if (getRefreshToken()) {
      refreshingToking = true;
      const tResponse: any = await processRequestNoAuth(
        "post",
        API_ENDPOINTS.REFRESH_TOKEN,
        { refresh_token: getRefreshToken() }
      );
      if (tResponse) {
        Cookies.set("auth_token", tResponse.token, { expires: 1 / 48 });
        Cookies.set("customer", JSON.stringify(tResponse.user), {
          expires: 1 / 48,
        });
        return tResponse;
      } else {
        Cookies.remove("refresh_token");
        Cookies.remove("auth_token");
        Cookies.remove("customer");
      }
    }
  } finally {
    refreshingToking = false;
  }
  return null;
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
