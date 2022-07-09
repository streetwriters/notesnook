"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorFloatingMenus = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const responsive_1 = require("../../components/responsive");
const hoverpopup_1 = require("./hoverpopup");
const searchreplace_1 = require("./searchreplace");
function EditorFloatingMenus(props) {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(searchreplace_1.SearchReplaceFloatingMenu, Object.assign({}, props)), (0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: (0, jsx_runtime_1.jsx)(hoverpopup_1.HoverPopupHandler, Object.assign({}, props)) })] }));
}
exports.EditorFloatingMenus = EditorFloatingMenus;
