import { processRequestAuth, processRequestNoAuth } from "@/framework/https";

export const authFectcher = (url: string) =>
  processRequestAuth("get", url).then((res) => res.data);

export const fetcher = (url: string) =>
  processRequestNoAuth("get", `${url}`).then((res) => res.data);
