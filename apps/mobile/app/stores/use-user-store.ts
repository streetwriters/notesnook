/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Profile, User } from "@notesnook/core";
import create, { State } from "zustand";

export enum SyncStatus {
  Passed,
  Failed,
  Never
}

export interface UserStore extends State {
  user: User | null | undefined;
  premium: boolean;
  lastSynced: string | number;
  syncing: boolean;
  lastSyncStatus: SyncStatus;
  setUser: (user: User | null | undefined) => void;
  setPremium: (premium: boolean) => void;
  setSyncing: (syncing: boolean, status?: SyncStatus) => void;
  setLastSynced: (lastSynced: number | "Never") => void;
  appLocked: boolean;
  lockApp: (verified: boolean) => void;
  disableAppLockRequests: boolean;
  setDisableAppLockRequests: (shouldBlockVerifyUser: boolean) => void;
  profile?: Partial<Profile>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  premium: false,
  lastSynced: "Never",
  syncing: false,
  appLocked: false,
  setUser: (user) => set({ user: user }),
  setPremium: (premium) => set({ premium: premium }),
  setSyncing: (syncing, status = SyncStatus.Passed) => {
    set({ syncing: syncing, lastSyncStatus: status });
  },
  setLastSynced: (lastSynced) => set({ lastSynced: lastSynced }),
  lockApp: (appLocked) => {
    set({ appLocked });
  },
  lastSyncStatus: SyncStatus.Never,
  disableAppLockRequests: false,
  setDisableAppLockRequests: (disableAppLockRequests) => {
    set({ disableAppLockRequests });
    setTimeout(() => {
      set({ disableAppLockRequests: false });
    }, 1000);
  },
  profile: undefined
}));
