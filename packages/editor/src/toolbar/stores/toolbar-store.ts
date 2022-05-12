import create from "zustand";

export type ToolbarLocation = "top" | "bottom";

interface ToolbarState {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
  toolbarLocation: ToolbarLocation;
  setToolbarLocation: (location: ToolbarLocation) => void;
}

export const useToolbarStore = create<ToolbarState>((set) => ({
  isMobile: false,
  setIsMobile: (isMobile) =>
    set((state) => {
      state.isMobile = isMobile;
    }),
  toolbarLocation: "top",
  setToolbarLocation: (location) =>
    set((state) => {
      state.toolbarLocation = location;
    }),
}));

export function useToolbarLocation() {
  return useToolbarStore((store) => store.toolbarLocation);
}

export function useIsMobile() {
  return useToolbarStore((store) => store.isMobile);
}
