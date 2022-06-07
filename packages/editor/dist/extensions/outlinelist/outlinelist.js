import { Node, mergeAttributes, wrappingInputRule } from "@tiptap/core";
import { createNodeView } from "../react";
import { OutlineListComponent } from "./component";
export var inputRegex = /^\s*(-o)\s$/;
var outlineListItemName = "outlineListItem";
export var OutlineList = Node.create({
    name: "outlineList",
    addOptions: function () {
        return {
            HTMLAttributes: {},
        };
    },
    addAttributes: function () {
        return {
            collapsed: {
                default: false,
                keepOnSplit: false,
                parseHTML: function (element) { return element.dataset.collapsed === "true"; },
                renderHTML: function (attributes) { return ({
                    "data-collapsed": attributes.collapsed === true,
                }); },
            },
        };
    },
    group: "block list",
    content: "".concat(outlineListItemName, "+"),
    parseHTML: function () {
        return [
            {
                tag: "ul[data-type=\"".concat(this.name, "\"]"),
                priority: 52,
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "ul",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": this.name,
            }),
            0,
        ];
    },
    addCommands: function () {
        var _this = this;
        return {
            toggleOutlineList: function () {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.toggleList(_this.name, outlineListItemName);
                };
            },
        };
    },
    addKeyboardShortcuts: function () {
        var _this = this;
        return {
            "Mod-Shift-O": function () { return _this.editor.commands.toggleOutlineList(); },
        };
    },
    addInputRules: function () {
        return [
            wrappingInputRule({
                find: inputRegex,
                type: this.type,
            }),
        ];
    },
    addNodeView: function () {
        var _this = this;
        return createNodeView(OutlineListComponent, {
            contentDOMFactory: function () {
                var content = document.createElement("ul");
                content.classList.add("".concat(_this.name.toLowerCase(), "-content-wrapper"));
                content.style.whiteSpace = "inherit";
                return { dom: content };
            },
        });
    },
});
