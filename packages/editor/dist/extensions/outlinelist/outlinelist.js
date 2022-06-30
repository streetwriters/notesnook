"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineList = exports.inputRegex = void 0;
var core_1 = require("@tiptap/core");
var react_1 = require("../react");
var component_1 = require("./component");
exports.inputRegex = /^\s*(-o)\s$/;
var outlineListItemName = "outlineListItem";
exports.OutlineList = core_1.Node.create({
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
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
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
            (0, core_1.wrappingInputRule)({
                find: exports.inputRegex,
                type: this.type,
            }),
        ];
    },
    addNodeView: function () {
        var _this = this;
        return (0, react_1.createNodeView)(component_1.OutlineListComponent, {
            contentDOMFactory: function () {
                var content = document.createElement("ul");
                content.classList.add("".concat(_this.name.toLowerCase(), "-content-wrapper"));
                content.style.whiteSpace = "inherit";
                return { dom: content };
            },
        });
    },
});
