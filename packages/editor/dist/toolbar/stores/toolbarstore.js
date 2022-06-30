"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsMobile = exports.useToolbarLocation = exports.useToolbarStore = void 0;
var zustand_1 = __importDefault(require("zustand"));
exports.useToolbarStore = (0, zustand_1.default)(function (set, get) { return ({
    isMobile: false,
    openedPopups: {},
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
    closePopup: function (id) {
        return set(function (state) {
            var _a;
            state.openedPopups = __assign(__assign({}, state.openedPopups), (_a = {}, _a[id] = false, _a));
        });
    },
    isPopupOpen: function (id) { return !!get().openedPopups[id]; },
    openPopup: function (ref) {
        return set(function (state) {
            var _a;
            state.openedPopups = __assign(__assign({}, state.openedPopups), (_a = {}, _a[ref.id] = ref, _a));
        });
    },
    closePopupGroup: function (group, excluded) {
        return set(function (state) {
            for (var key in state.openedPopups) {
                var ref = state.openedPopups[key];
                if (ref && ref.group === group && !excluded.includes(ref.id)) {
                    state.openedPopups[key] = false;
                }
            }
        });
    },
}); });
function useToolbarLocation() {
    return (0, exports.useToolbarStore)(function (store) { return store.toolbarLocation; });
}
exports.useToolbarLocation = useToolbarLocation;
function useIsMobile() {
    return (0, exports.useToolbarStore)(function (store) { return store.isMobile; });
}
exports.useIsMobile = useIsMobile;
