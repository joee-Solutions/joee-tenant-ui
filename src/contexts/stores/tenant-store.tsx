import { createStore } from "zustand/vanilla";
import { devtools, persist } from "zustand/middleware";

export type StoreActions = {
  setStoreState: (state: Partial<StoreState>) => void;
  setUser: (user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }) => void;
};
export type StoreState = {
  loading: boolean;
  error: string | null;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
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
            setUser: (user) => {
              set((prev) => ({
                state: { ...prev.state, user },
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
