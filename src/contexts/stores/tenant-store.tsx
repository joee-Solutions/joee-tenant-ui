import { createStore } from "zustand/vanilla";
import { devtools, persist } from "zustand/middleware";

export type StoreActions = {
  setStoreState: (state: Partial<StoreState>) => void;
};
export type StoreState = {
  loading: boolean;
  error: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type StoreContextType = {
  state: StoreState;
  actions: StoreActions;
};

export const initialState: StoreState = {
  loading: false,
  error: null,
  user: undefined,
};

export const createJoeeStore = (initState: StoreState = initialState) => {
  return createStore<StoreContextType>()(
    devtools(
      persist(
        (set, get) => ({
          state: initState,
          actions: {
            setStoreState: (state) => {
              set((prev) => ({
                state: { ...prev.state, ...state },
              }));
            },
          },
        }),
        {
          name: "joee-store",
          partialize: (state) => ({ user: state.state.user }),
        }
      )
    )
  );
};
