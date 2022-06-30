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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dropdown = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var rebass_1 = require("rebass");
var icon_1 = require("./icon");
var icons_1 = require("../icons");
var toolbarstore_1 = require("../stores/toolbarstore");
var menu_1 = require("../../components/menu");
var dom_1 = require("../utils/dom");
function Dropdown(props) {
    var items = props.items, selectedItem = props.selectedItem, buttonRef = props.buttonRef, menuWidth = props.menuWidth;
    var internalRef = (0, react_1.useRef)();
    var _a = __read((0, react_1.useState)(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    var isMobile = (0, toolbarstore_1.useIsMobile)();
    var isBottom = toolbarLocation === "bottom";
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Button, __assign({ ref: function (ref) {
                    internalRef.current = ref;
                    if (buttonRef)
                        buttonRef.current = ref;
                }, sx: {
                    p: 1,
                    m: 0,
                    bg: isOpen ? "hover" : "transparent",
                    mr: 1,
                    display: "flex",
                    alignItems: "center",
                    ":hover": { bg: "hover" },
                    ":last-of-type": {
                        mr: 0,
                    },
                }, onClick: function () { return setIsOpen(function (s) { return !s; }); }, onMouseDown: function (e) { return e.preventDefault(); } }, { children: [typeof selectedItem === "string" ? ((0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ sx: { fontSize: "subBody", mr: 1, color: "text" } }, { children: selectedItem }))) : (selectedItem), (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: isBottom ? icons_1.Icons.chevronUp : icons_1.Icons.chevronDown, size: "small", color: "text" })] })), (0, jsx_runtime_1.jsx)(menu_1.MenuPresenter, { isOpen: isOpen, items: items, onClose: function () { return setIsOpen(false); }, position: {
                    target: isBottom
                        ? (0, dom_1.getToolbarElement)()
                        : internalRef.current || "mouse",
                    isTargetAbsolute: true,
                    location: isBottom ? "top" : "below",
                    align: "center",
                    yOffset: 5,
                }, blocking: !isMobile, focusOnRender: !isMobile, sx: {
                    minWidth: menuWidth,
                    maxWidth: isBottom ? "95vw" : "auto",
                    flexDirection: isBottom ? "row" : "column",
                    overflowX: isBottom ? "auto" : "hidden",
                    marginRight: isBottom ? "10px" : 0,
                    display: "flex",
                    alignItems: isBottom ? "center" : "unset",
                } })] }));
}
exports.Dropdown = Dropdown;
