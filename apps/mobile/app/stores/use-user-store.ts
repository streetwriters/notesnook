//@ts-ignore
import create, { State } from "zustand";

export interface UserStore extends State {
  user: User | null | undefined;
  premium: boolean;
  lastSynced: string;
  syncing: boolean;
  setUser: (user: User | null | undefined) => void;
  setPremium: (premium: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSynced: (lastSynced: string) => void;
  verifyUser: boolean;
  setVerifyUser: (verified: boolean) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  premium: false,
  lastSynced: "Never",
  syncing: false,
  verifyUser: false,
  setUser: (user) => set({ user: user }),
  setPremium: (premium) => set({ premium: premium }),
  setSyncing: (syncing) => set({ syncing: syncing }),
  setLastSynced: (lastSynced) => set({ lastSynced: lastSynced }),
  setVerifyUser: (verified) => set({ verifyUser: verified })
}));
