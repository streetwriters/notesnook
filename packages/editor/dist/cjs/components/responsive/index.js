"use strict";
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
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
const actionsheet_1 = require("../actionsheet");
const menu_1 = require("../menu");
function ResponsiveContainer(props) {
    const isMobile = (0, toolbarstore_1.useIsMobile)();
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
    const { mobile = "menu", desktop = "menu" } = props, restProps = __rest(props, ["mobile", "desktop"]);
    const isMobile = (0, toolbarstore_1.useIsMobile)();
    if (isMobile && mobile === "sheet")
        return (0, jsx_runtime_1.jsx)(actionsheet_1.ActionSheetPresenter, Object.assign({}, restProps));
    else if (mobile === "menu" || desktop === "menu")
        return (0, jsx_runtime_1.jsx)(menu_1.MenuPresenter, Object.assign({}, restProps));
    else
        return props.isOpen ? (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: props.children }) : null;
}
exports.ResponsivePresenter = ResponsivePresenter;
