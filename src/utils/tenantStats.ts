import { extractMeta } from "@/framework/joee.client";
import type { Tenant } from "@/lib/types";

/** Unwrap tenant list responses that may be paginated (default page size is often 10). */
export function normalizeTenantsArray(data: unknown): Tenant[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    const flattened = data.flat();
    return flattened.filter(
      (item): item is Tenant =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        !Array.isArray(item)
    );
  }
  if (data && typeof data === "object" && "id" in data) {
    return [data as Tenant];
  }
  return [];
}

/** Prefer API meta.total over the current page array length for stat cards. */
export function resolveTenantStatCount(
  response: unknown,
  tenants: Tenant[]
): number {
  const meta = extractMeta(response as Parameters<typeof extractMeta>[0]);
  if (meta && typeof meta.total === "number" && meta.total >= 0) {
    return meta.total;
  }

  const nested =
    (response as { data?: { meta?: { total?: number } } })?.data?.meta
      ?.total ??
    (response as { data?: { data?: { meta?: { total?: number } } } })?.data
      ?.data?.meta?.total;

  if (typeof nested === "number" && nested >= 0) {
    return nested;
  }

  return tenants.length;
}
