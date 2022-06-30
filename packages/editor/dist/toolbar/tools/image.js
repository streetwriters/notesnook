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
exports.ImageProperties = exports.ImageAlignCenter = exports.ImageAlignRight = exports.ImageAlignLeft = exports.ImageSettings = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbutton_1 = require("../components/toolbutton");
var react_1 = require("react");
var responsive_1 = require("../../components/responsive");
var moretools_1 = require("../components/moretools");
var toolbarstore_1 = require("../stores/toolbarstore");
var imageproperties_1 = require("../popups/imageproperties");
var prosemirror_1 = require("../utils/prosemirror");
function ImageSettings(props) {
    var _a, _b;
    var editor = props.editor;
    var isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("image") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "imageSettings", tools: ((_b = (_a = (0, prosemirror_1.findSelectedNode)(editor, "image")) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.float)
            ? ["imageAlignLeft", "imageAlignRight", "imageProperties"]
            : [
                "imageAlignLeft",
                "imageAlignCenter",
                "imageAlignRight",
                "imageProperties",
            ] })));
}
exports.ImageSettings = ImageSettings;
function ImageAlignLeft(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "left" }).run();
        } })));
}
exports.ImageAlignLeft = ImageAlignLeft;
function ImageAlignRight(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "right" }).run();
        } })));
}
exports.ImageAlignRight = ImageAlignRight;
function ImageAlignCenter(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "center" }).run();
        } })));
}
exports.ImageAlignCenter = ImageAlignCenter;
function ImageProperties(props) {
    var editor = props.editor;
    var _a = __read((0, react_1.useState)(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var buttonRef = (0, react_1.useRef)();
    // TODO: defer until user opens the popup
    var image = (0, react_1.useMemo)(function () { return (0, prosemirror_1.findSelectedNode)(editor, "image"); }, []);
    var _b = ((image === null || image === void 0 ? void 0 : image.attrs) ||
        {}), float = _b.float, align = _b.align, width = _b.width, height = _b.height;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({ buttonRef: buttonRef, toggled: isOpen }, props, { onClick: function () { return setIsOpen(function (s) { return !s; }); } })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, __assign({ isOpen: isOpen, desktop: "menu", mobile: "sheet", onClose: function () { return setIsOpen(false); }, blocking: true, focusOnRender: false, position: {
                    target: buttonRef.current || "mouse",
                    align: "start",
                    location: "below",
                    yOffset: 10,
                    isTargetAbsolute: true,
                } }, { children: (0, jsx_runtime_1.jsx)(imageproperties_1.ImageProperties, { editor: editor, height: height, width: width, align: align, float: float, onClose: function () { return setIsOpen(false); } }) }))] }));
}
exports.ImageProperties = ImageProperties;
