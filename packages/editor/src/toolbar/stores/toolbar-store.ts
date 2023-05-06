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

import { ThemeDefinition, ThemeLight } from "@notesnook/theme";
import { create } from "zustand";
import { DownloadOptions } from "../../utils/downloader";

export type ToolbarLocation = "top" | "bottom";

export type PopupRef = { id: string; group: string };
interface ToolbarState {
  theme: ThemeDefinition;
  setTheme: (theme: ThemeDefinition) => void;
  downloadOptions?: DownloadOptions;
  setDownloadOptions: (options?: DownloadOptions) => void;
  isMobile: boolean;
  openedPopups: Record<string, PopupRef | false | undefined>;
  setIsMobile: (isMobile: boolean) => void;
  toolbarLocation: ToolbarLocation;
  setToolbarLocation: (location: ToolbarLocation) => void;
  isPopupOpen: (popupId: string) => boolean;
  openPopup: (ref: PopupRef) => void;
  closePopup: (popupId: string) => void;
  closePopupGroup: (groupId: string, excluded: string[]) => void;
  closeAllPopups: () => void;
  fontFamily: string;
  setFontFamily: (fontFamily: string) => void;
  fontSize: number;
  setFontSize: (fontSize: number) => void;
}

export const useToolbarStore = create<ToolbarState>((set, get) => ({
  theme: ThemeLight,
  downloadOptions: undefined,
  isMobile: false,
  openedPopups: {},
  setDownloadOptions: (options) => set({ downloadOptions: options }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setTheme: (theme) => set({ theme }),
  toolbarLocation: "top",
  setToolbarLocation: (location) => set({ toolbarLocation: location }),
  closePopup: (id) =>
    set((state) => {
      state.openedPopups = {
        ...state.openedPopups,
        [id]: undefined
      };
      return state;
    }),
  isPopupOpen: (id) => !!get().openedPopups[id],
  openPopup: (ref) =>
    set((state) => {
      state.openedPopups = {
        ...state.openedPopups,
        [ref.id]: ref
      };
      return state;
    }),
  closePopupGroup: (group, excluded) =>
    set((state) => {
      for (const key in state.openedPopups) {
        const ref = state.openedPopups[key];
        if (ref && ref.group === group && !excluded.includes(ref.id)) {
          state.openedPopups[key] = undefined;
        }
      }
      return state;
    }),
  closeAllPopups: () =>
    set((state) => {
      for (const key in state.openedPopups) {
        state.openedPopups[key] = undefined;
      }
      return state;
    }),
  fontFamily: "sans-serif",
  setFontFamily: (fontFamily) =>
    set((state) => {
      state.fontFamily = fontFamily;
      return state;
    }),
  fontSize: 16,
  setFontSize: (fontSize) =>
    set((state) => {
      state.fontSize = fontSize;
      return state;
    })
}));

export function useToolbarLocation() {
  return useToolbarStore((store) => store.toolbarLocation);
}

export function useIsMobile() {
  return useToolbarStore((store) => store.isMobile);
}

export const useTheme = Object.defineProperty(
  () => {
    return useToolbarStore((store) => store.theme);
  },
  "current",
  {
    get: () => useToolbarStore.getState().theme
  }
) as (() => ThemeDefinition) & {
  current: ThemeDefinition;
};
