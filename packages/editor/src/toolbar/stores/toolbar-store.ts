/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Theme } from "@notesnook/theme";
import create from "zustand";
import { DownloadOptions } from "../../utils/downloader";
import { FontFamily } from "../tools/font";

export type ToolbarLocation = "top" | "bottom";

export type PopupRef = { id: string; group: string };
interface ToolbarState {
  theme?: Theme;
  setTheme: (theme?: Theme) => void;
  downloadOptions?: DownloadOptions;
  setDownloadOptions: (options?: DownloadOptions) => void;
  isKeyboardOpen: boolean;
  setIsKeyboardOpen: (isKeyboardOpen: boolean) => void;
  isMobile: boolean;
  openedPopups: Record<string, PopupRef | false>;
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
  fontSize: string;
  setFontSize: (fontSize: string) => void;
}

export const useToolbarStore = create<ToolbarState>((set, get) => ({
  theme: undefined,
  downloadOptions: undefined,
  isMobile: false,
  isKeyboardOpen: true,
  openedPopups: {},
  setDownloadOptions: (options) =>
    set((state) => {
      state.downloadOptions = options;
    }),
  setIsKeyboardOpen: (isKeyboardOpen) =>
    set((state) => {
      state.isKeyboardOpen = isKeyboardOpen;
    }),
  setIsMobile: (isMobile) =>
    set((state) => {
      state.isMobile = isMobile;
    }),
  setTheme: (theme) =>
    set((state) => {
      state.theme = theme;
    }),
  toolbarLocation: "top",
  setToolbarLocation: (location) =>
    set((state) => {
      state.toolbarLocation = location;
    }),
  closePopup: (id) =>
    set((state) => {
      state.openedPopups = {
        ...state.openedPopups,
        [id]: false
      };
    }),
  isPopupOpen: (id) => !!get().openedPopups[id],
  openPopup: (ref) =>
    set((state) => {
      state.openedPopups = {
        ...state.openedPopups,
        [ref.id]: ref
      };
    }),
  closePopupGroup: (group, excluded) =>
    set((state) => {
      for (const key in state.openedPopups) {
        const ref = state.openedPopups[key];
        if (ref && ref.group === group && !excluded.includes(ref.id)) {
          state.openedPopups[key] = false;
        }
      }
    }),
  closeAllPopups: () =>
    set((state) => {
      for (const key in state.openedPopups) {
        state.openedPopups[key] = false;
      }
    }),
  fontFamily: "",
  setFontFamily: (fontFamily) =>
    set((state) => {
      state.fontFamily = fontFamily;
    }),
  fontSize: "",
  setFontSize: (fontSize) =>
    set((state) => {
      state.fontSize = fontSize;
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
) as (() => Theme | undefined) & { current: Theme | undefined };

export const useIsKeyboardOpen = Object.defineProperty(
  () => {
    return useToolbarStore((store) => store.isKeyboardOpen);
  },
  "current",
  {
    get: () => useToolbarStore.getState().isKeyboardOpen
  }
) as (() => boolean) & { current: boolean };
