import { Node, mergeAttributes } from "@tiptap/core";
import { onBackspacePressed } from "../list-item/commands";
export var OutlineListItem = Node.create({
    name: "outlineListItem",
    addOptions: function () {
        return {
            HTMLAttributes: {},
        };
    },
    content: "paragraph block*",
    defining: true,
    parseHTML: function () {
        return [
            {
                tag: "ul[data-list-type=\"outline\"] > li",
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "li",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
            0,
        ];
    },
    addKeyboardShortcuts: function () {
        var _this = this;
        return {
            Enter: function () { return _this.editor.commands.splitListItem(_this.name); },
            Tab: function () { return _this.editor.commands.sinkListItem(_this.name); },
            "Shift-Tab": function () { return _this.editor.commands.liftListItem(_this.name); },
            Backspace: function (_a) {
                var editor = _a.editor;
                return onBackspacePressed(editor, _this.name, _this.type);
            },
        };
    },
});
