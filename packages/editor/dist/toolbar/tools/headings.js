"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Headings = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var dropdown_1 = require("../components/dropdown");
var toolbarstore_1 = require("../stores/toolbarstore");
var react_1 = require("react");
var defaultLevels = [1, 2, 3, 4, 5, 6];
function Headings(props) {
    var editor = props.editor;
    var toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    var currentHeadingLevel = defaultLevels.find(function (level) {
        return editor.isActive("heading", { level: level });
    });
    var items = (0, react_1.useMemo)(function () { return toMenuItems(editor, toolbarLocation, currentHeadingLevel); }, [currentHeadingLevel]);
    return ((0, jsx_runtime_1.jsx)(dropdown_1.Dropdown, { selectedItem: currentHeadingLevel ? "Heading ".concat(currentHeadingLevel) : "Paragraph", items: items, menuWidth: 130 }));
}
exports.Headings = Headings;
function toMenuItems(editor, toolbarLocation, currentHeadingLevel) {
    var menuItems = defaultLevels.map(function (level) { return ({
        type: "button",
        key: "heading-".concat(level),
        title: toolbarLocation === "bottom" ? "H".concat(level) : "Heading ".concat(level),
        isChecked: level === currentHeadingLevel,
        onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().updateAttributes("textStyle", { fontSize: null, fontStyle: null }).setHeading({ level: level }).run();
        },
    }); });
    var paragraph = {
        key: "paragraph",
        type: "button",
        title: "Paragraph",
        isChecked: !currentHeadingLevel,
        onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setParagraph().run(); },
    };
    return __spreadArray([paragraph], __read(menuItems), false);
}
