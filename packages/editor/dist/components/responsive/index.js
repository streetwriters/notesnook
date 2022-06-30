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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsivePresenter = exports.MobileOnly = exports.DesktopOnly = exports.ResponsiveContainer = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
var actionsheet_1 = require("../actionsheet");
var menu_1 = require("../menu");
function ResponsiveContainer(props) {
    var isMobile = (0, toolbarstore_1.useIsMobile)();
    if (isMobile)
        return props.mobile || null;
    else
        return props.desktop || null;
}
exports.ResponsiveContainer = ResponsiveContainer;
function DesktopOnly(props) {
    return (0, jsx_runtime_1.jsx)(ResponsiveContainer, { desktop: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: props.children }) });
}
exports.DesktopOnly = DesktopOnly;
function MobileOnly(props) {
    return (0, jsx_runtime_1.jsx)(ResponsiveContainer, { mobile: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: props.children }) });
}
exports.MobileOnly = MobileOnly;
function ResponsivePresenter(props) {
    var _a = props.mobile, mobile = _a === void 0 ? "menu" : _a, _b = props.desktop, desktop = _b === void 0 ? "menu" : _b, restProps = __rest(props, ["mobile", "desktop"]);
    var isMobile = (0, toolbarstore_1.useIsMobile)();
    if (isMobile && mobile === "sheet")
        return (0, jsx_runtime_1.jsx)(actionsheet_1.ActionSheetPresenter, __assign({}, restProps));
    else if (mobile === "menu" || desktop === "menu")
        return (0, jsx_runtime_1.jsx)(menu_1.MenuPresenter, __assign({}, restProps));
    else
        return props.isOpen ? (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: props.children }) : null;
}
exports.ResponsivePresenter = ResponsivePresenter;
