// src/providers/counter-store-provider.tsx
"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";

import {
  type StoreContextType,
  createJoeeStore,
} from "@/contexts/stores/tenant-store";

export type TenantStoreApi = ReturnType<typeof createJoeeStore>;

export const TenantStoreContext = createContext<TenantStoreApi | undefined>(
  undefined
);

export interface TenantStoreProviderProps {
  children: ReactNode;
}

export const TenantStoreProvider = ({ children }: TenantStoreProviderProps) => {
  const storeRef = useRef<TenantStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createJoeeStore();
  }

  return (
    <TenantStoreContext.Provider value={storeRef.current}>
      {children}
    </TenantStoreContext.Provider>
  );
};

export const useTenantStore = <T,>(
  selector: (store: StoreContextType) => T
): T => {
  const tenantStoreContext = useContext(TenantStoreContext);

  if (!tenantStoreContext) {
    throw new Error(`useTenantStore must be used within TenantStoreProvider`);
  }

  return useStore(tenantStoreContext, selector);
};
