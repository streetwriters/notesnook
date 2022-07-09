import { Theme } from "@notesnook/theme";
import create from "zustand";

export type ToolbarLocation = "top" | "bottom";

export type PopupRef = { id: string; group: string };
interface ToolbarState {
  theme?: Theme;
  setTheme: (theme?: Theme) => void;
  isMobile: boolean;
  openedPopups: Record<string, PopupRef | false>;
  setIsMobile: (isMobile: boolean) => void;
  toolbarLocation: ToolbarLocation;
  setToolbarLocation: (location: ToolbarLocation) => void;
  isPopupOpen: (popupId: string) => boolean;
  openPopup: (ref: PopupRef) => void;
  closePopup: (popupId: string) => void;
  closePopupGroup: (groupId: string, excluded: string[]) => void;
}

export const useToolbarStore = create<ToolbarState>((set, get) => ({
  theme: undefined,
  isMobile: false,
  openedPopups: {},
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
        [id]: false,
      };
    }),
  isPopupOpen: (id) => !!get().openedPopups[id],
  openPopup: (ref) =>
    set((state) => {
      state.openedPopups = {
        ...state.openedPopups,
        [ref.id]: ref,
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
  "theme",
  {
    get: () => useToolbarStore.getState().theme,
  }
) as (() => Theme | undefined) & { theme: Theme | undefined };
