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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorFloatingMenus = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var hoverpopup_1 = require("./hoverpopup");
var searchreplace_1 = require("./searchreplace");
function EditorFloatingMenus(props) {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(searchreplace_1.SearchReplaceFloatingMenu, __assign({}, props)), (0, jsx_runtime_1.jsx)(hoverpopup_1.HoverPopupHandler, __assign({}, props))] }));
}
exports.EditorFloatingMenus = EditorFloatingMenus;
