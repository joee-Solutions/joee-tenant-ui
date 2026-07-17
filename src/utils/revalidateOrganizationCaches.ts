import { API_ENDPOINTS } from "@/framework/api-endpoints";

type Mutate = (
  filter: (key: unknown) => boolean,
  data?: unknown,
  opts?: { revalidate?: boolean }
) => unknown;

/** Revalidate all organization list + stat SWR keys after create/edit/delete. */
export function revalidateOrganizationCaches(mutate: Mutate): void {
  const keys = [
    API_ENDPOINTS.GET_ALL_TENANTS,
    API_ENDPOINTS.GET_ALL_TENANTS_ACTIVE,
    API_ENDPOINTS.GET_ALL_TENANTS_INACTIVE,
    API_ENDPOINTS.GET_DASHBOARD_DATA,
    "/organization/status",
  ];

  void mutate(
    (key) => typeof key === "string" && keys.some((k) => key.includes(k)),
    undefined,
    { revalidate: true }
  );
}
