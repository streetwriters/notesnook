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
var defaultLevels = [1, 2, 3, 4, 5, 6];
export function Headings(props) {
    var editor = props.editor;
    var currentHeadingLevel = defaultLevels.find(function (level) {
        return editor.isActive("heading", { level: level });
    });
    return (_jsx(Dropdown, { selectedItem: currentHeadingLevel ? "Heading ".concat(currentHeadingLevel) : "Paragraph", items: toMenuItems(editor, currentHeadingLevel), menuWidth: 130 }));
}
function toMenuItems(editor, currentHeadingLevel) {
    var menuItems = defaultLevels.map(function (level) { return ({
        type: "button",
        key: "heading-".concat(level),
        title: "Heading ".concat(level),
        isChecked: level === currentHeadingLevel,
        onClick: function () {
            return editor
                .chain()
                .focus()
                .setHeading({ level: level })
                .run();
        },
    }); });
    var paragraph = {
        key: "paragraph",
        type: "button",
        title: "Paragraph",
        isChecked: !currentHeadingLevel,
        onClick: function () { return editor.chain().focus().setParagraph().run(); },
    };
    return __spreadArray([paragraph], __read(menuItems), false);
}
