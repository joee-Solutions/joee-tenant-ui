"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { registerDashboardSWRMutate } from "@/lib/offline/swrMutateBridge";

/**
 * Mount once under the dashboard layout so offline optimistic updates use the same
 * SWR cache as `useSWR` hooks in org tables.
 */
export default function OfflineSWRBridge() {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    registerDashboardSWRMutate(mutate);
    return () => registerDashboardSWRMutate(null);
  }, [mutate]);

  return null;
}
