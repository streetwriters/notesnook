"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsMobile = exports.useToolbarLocation = exports.useToolbarStore = void 0;
const zustand_1 = __importDefault(require("zustand"));
exports.useToolbarStore = (0, zustand_1.default)((set, get) => ({
    isMobile: false,
    openedPopups: {},
    setIsMobile: (isMobile) => set((state) => {
        state.isMobile = isMobile;
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
function useToolbarLocation() {
    return (0, exports.useToolbarStore)((store) => store.toolbarLocation);
}
exports.useToolbarLocation = useToolbarLocation;
function useIsMobile() {
    return (0, exports.useToolbarStore)((store) => store.isMobile);
}
exports.useIsMobile = useIsMobile;
