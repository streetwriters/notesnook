import create from "zustand";
export const useToolbarStore = create((set, get) => ({
    theme: undefined,
    isMobile: false,
    openedPopups: {},
    setIsMobile: (isMobile) => set((state) => {
        state.isMobile = isMobile;
    }),
    setTheme: (theme) => set((state) => {
        state.theme = theme;
    }),
    toolbarLocation: "top",
    setToolbarLocation: (location) => set((state) => {
        state.toolbarLocation = location;
    }),
    closePopup: (id) => set((state) => {
        state.openedPopups = Object.assign(Object.assign({}, state.openedPopups), { [id]: false });
    }),
    isPopupOpen: (id) => !!get().openedPopups[id],
    openPopup: (ref) => set((state) => {
        state.openedPopups = Object.assign(Object.assign({}, state.openedPopups), { [ref.id]: ref });
    }),
    closePopupGroup: (group, excluded) => set((state) => {
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
export const useTheme = Object.defineProperty(() => {
    return useToolbarStore((store) => store.theme);
}, "theme", {
    get: () => useToolbarStore.getState().theme,
});
