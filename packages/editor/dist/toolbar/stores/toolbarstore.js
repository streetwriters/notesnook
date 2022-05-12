import create from "zustand";
export var useToolbarStore = create(function (set) { return ({
    isMobile: false,
    setIsMobile: function (isMobile) {
        return set(function (state) {
            state.isMobile = isMobile;
        });
    },
    toolbarLocation: "top",
    setToolbarLocation: function (location) {
        return set(function (state) {
            state.toolbarLocation = location;
        });
    },
}); });
export function useToolbarLocation() {
    return useToolbarStore(function (store) { return store.toolbarLocation; });
}
export function useIsMobile() {
    return useToolbarStore(function (store) { return store.isMobile; });
}
