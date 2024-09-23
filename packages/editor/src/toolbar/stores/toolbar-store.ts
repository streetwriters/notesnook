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
import { DownloadOptions } from "../../utils/downloader.js";
import { useCallback } from "react";

export type ToolbarLocation = "top" | "bottom";

export type PopupRef = {
  id: string;
  group: string;
  pinned?: boolean;
  parent?: string;
};
interface ToolbarState {
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
  downloadOptions: undefined,
  isMobile: false,
  openedPopups: {},
  setDownloadOptions: (options) => set({ downloadOptions: options }),
  setIsMobile: (isMobile) => set({ isMobile }),
  toolbarLocation: "top",
  setToolbarLocation: (location) => set({ toolbarLocation: location }),
  closePopup: (id) =>
    set({
      openedPopups: {
        ...get().openedPopups,
        [id]: undefined
      }
    }),
  isPopupOpen: (id) => !!get().openedPopups[id],
  openPopup: (ref) =>
    set({
      openedPopups: {
        ...get().openedPopups,
        [ref.id]: ref
      }
    }),
  closePopupGroup: (group, excluded) =>
    set((state) => {
      for (const key in state.openedPopups) {
        const ref = state.openedPopups[key];
        if (
          ref &&
          ref.group === group &&
          !excluded.includes(ref.id) &&
          !ref.pinned &&
          !isChildPinned(state.openedPopups, ref.id)
        ) {
          state.openedPopups[key] = undefined;
        }
      }
      return state;
    }),
  closeAllPopups: () =>
    set((state) => {
      for (const key in state.openedPopups) {
        const ref = state.openedPopups[key];
        if (ref && !ref.pinned && !isChildPinned(state.openedPopups, ref.id))
          state.openedPopups[key] = undefined;
      }
      return state;
    }),
  fontFamily: "sans-serif",
  setFontFamily: (fontFamily) => set({ fontFamily }),
  fontSize: 16,
  setFontSize: (fontSize) => set({ fontSize })
}));

export function useToolbarLocation() {
  return useToolbarStore((store) => store.toolbarLocation);
}

export function useIsMobile() {
  return useToolbarStore((store) => store.isMobile);
}

export function usePopupManager(options: {
  id: string;
  group: string;
  parent?: string;
}) {
  const { id, parent } = options;
  const openedPopups = useToolbarStore((store) => store.openedPopups);
  const openPopup = useToolbarStore((store) => store.openPopup);
  const closePopup = useToolbarStore((store) => store.closePopup);
  const closePopupGroup = useToolbarStore((store) => store.closePopupGroup);
  const isMobile = useIsMobile();
  const isOpen = typeof openedPopups[id] === "object";
  const isPinned =
    typeof openedPopups[id] === "object" &&
    (!!openedPopups[id]?.pinned || isChildPinned(openedPopups, id));
  const group = isMobile ? "mobile" : options.group;

  const open = useCallback(() => {
    closePopupGroup(group, [id, parent || ""]);
    openPopup({
      id,
      group,
      parent,
      pinned: isParentPinned(useToolbarStore.getState().openedPopups, parent)
    });
  }, [openPopup, closePopupGroup, group, id, parent]);

  const close = useCallback(() => {
    closePopup(id);
    useToolbarStore.setState((state) => {
      toggleChildState(
        state.openedPopups,
        (ref) => {
          state.openedPopups[ref.id] = undefined;
        },
        id
      );
      return state;
    });
  }, [closePopup, id]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, close, open]);

  const togglePinned = useCallback(() => {
    useToolbarStore.setState((state) => {
      toggleChildState(
        state.openedPopups,
        (ref) => (ref.pinned = !isPinned),
        id
      );
      return state;
    });
    if (isPinned) openPopup({ group, id, parent, pinned: false });
    else openPopup({ group, id, parent, pinned: true });
  }, [isPinned, openPopup, id, group, parent]);

  return { isOpen, open, close, toggle, isPinned, togglePinned };
}

function toggleChildState(
  popups: Record<string, PopupRef | undefined | false>,
  action: (ref: PopupRef) => void,
  parent?: string
) {
  if (!parent) return;
  for (const key in popups) {
    const ref = popups[key];
    if (ref && ref.parent === parent) {
      action(ref);
      toggleChildState(popups, action, ref.id);
    }
  }
}

function isParentPinned(
  popups: Record<string, PopupRef | undefined | false>,
  parent?: string
) {
  if (!parent) return;
  for (const key in popups) {
    const ref = popups[key];
    if (ref && ref.id === parent && ref.pinned) {
      return true;
    }
  }
  return false;
}

function isChildPinned(
  popups: Record<string, PopupRef | undefined | false>,
  id: string
) {
  for (const key in popups) {
    const ref = popups[key];
    if (ref && ref.parent === id && ref.pinned) {
      return true;
    }
  }
  return false;
}
