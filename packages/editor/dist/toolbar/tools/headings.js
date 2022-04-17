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
var Headings = /** @class */ (function () {
    function Headings() {
        var _this = this;
        this.title = "Headings";
        this.id = "headings";
        this.defaultLevels = [1, 2, 3, 4, 5, 6];
        this.render = function (props) {
            var editor = props.editor;
            var currentHeadingLevel = _this.defaultLevels.find(function (level) {
                return editor.isActive("heading", { level: level });
            });
            return (_jsx(Dropdown, { selectedItem: currentHeadingLevel ? "Heading ".concat(currentHeadingLevel) : "Paragraph", items: _this.toMenuItems(editor, currentHeadingLevel) }));
        };
    }
    Headings.prototype.toMenuItems = function (editor, currentHeadingLevel) {
        var menuItems = this.defaultLevels.map(function (level) { return ({
            type: "menuitem",
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
            type: "menuitem",
            title: "Paragraph",
            isChecked: !currentHeadingLevel,
            onClick: function () { return editor.chain().focus().setParagraph().run(); },
        };
        return __spreadArray([paragraph], menuItems, true);
    };
    return Headings;
}());
export { Headings };
