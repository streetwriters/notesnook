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

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SafeAreaType } from "../utils";

type SafeAreaStore = {
  insets: SafeAreaType;
  setInsets: (insets: SafeAreaType) => void;
};

export const useSafeAreaStore = create<SafeAreaStore>()(
  persist(
    (set) => ({
      insets: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      setInsets: (insets) => set({ insets })
    }),
    {
      name: "safeAreaInsets",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ insets: state.insets })
    }
  )
);
