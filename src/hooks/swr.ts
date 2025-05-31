import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { processRequestAuth, processRequestNoAuth } from "@/framework/https";
import { toast } from "react-toastify";
import useSWR from "swr";

export const authFectcher = (url: string) =>
  processRequestAuth("get", url).then((res) => res.data);

export const fetcher = (url: string) =>
  processRequestNoAuth("get", `${url}`).then((res) => res.data);

export const useTenant = (slug) => {
  const { data, isLoading, error } = useSWR(
    API_ENDPOINTS.GET_TENANT(slug),
    authFectcher
  );
  if(error){
    toast.error("Failed to fetch tenant data");
  }

  return {
    data,
    isLoading,
    error,
  };
};
