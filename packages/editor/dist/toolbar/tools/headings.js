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
import { jsx as _jsx } from "react/jsx-runtime";
import { Dropdown } from "../components/dropdown";
import { useToolbarLocation } from "../stores/toolbar-store";
import { useMemo } from "react";
var defaultLevels = [1, 2, 3, 4, 5, 6];
export function Headings(props) {
    var editor = props.editor;
    var toolbarLocation = useToolbarLocation();
    var currentHeadingLevel = defaultLevels.find(function (level) {
        return editor.isActive("heading", { level: level });
    });
    var items = useMemo(function () { return toMenuItems(editor, toolbarLocation, currentHeadingLevel); }, [currentHeadingLevel]);
    return (_jsx(Dropdown, { selectedItem: currentHeadingLevel ? "Heading ".concat(currentHeadingLevel) : "Paragraph", items: items, menuWidth: 130 }));
}
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
