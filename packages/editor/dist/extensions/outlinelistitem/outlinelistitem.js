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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineListItem = void 0;
var core_1 = require("@tiptap/core");
var prosemirror_utils_1 = require("prosemirror-utils");
var commands_1 = require("../list-item/commands");
var outlinelist_1 = require("../outline-list/outlinelist");
var react_1 = require("../react");
var component_1 = require("./component");
exports.OutlineListItem = core_1.Node.create({
    name: "outlineListItem",
    addOptions: function () {
        return {
            HTMLAttributes: {},
        };
    },
    content: "heading* block*",
    defining: true,
    parseHTML: function () {
        return [
            {
                tag: "li[data-type=\"".concat(this.name, "\"]"),
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "li",
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": this.name,
            }),
            0,
        ];
    },
    addKeyboardShortcuts: function () {
        var _this = this;
        return {
            "Mod-Space": function (_a) {
                var editor = _a.editor;
                var subList = findSublist(editor, _this.type);
                if (!subList)
                    return false;
                var isCollapsed = subList.isCollapsed, subListPos = subList.subListPos;
                return _this.editor.commands.toggleOutlineCollapse(subListPos, !isCollapsed);
            },
            Enter: function (_a) {
                var editor = _a.editor;
                var subList = findSublist(editor, _this.type);
                if (!subList)
                    return false;
                var isCollapsed = subList.isCollapsed, subListPos = subList.subListPos;
                if (isCollapsed) {
                    return _this.editor.commands.toggleOutlineCollapse(subListPos, false);
                }
                return _this.editor.commands.splitListItem(_this.name);
            },
            Tab: function () { return _this.editor.commands.sinkListItem(_this.name); },
            "Shift-Tab": function () { return _this.editor.commands.liftListItem(_this.name); },
            Backspace: function (_a) {
                var editor = _a.editor;
                return (0, commands_1.onBackspacePressed)(editor, _this.name, _this.type);
            },
        };
    },
    addCommands: function () {
        return {
            toggleOutlineCollapse: function (pos, state) {
                return function (_a) {
                    var tr = _a.tr;
                    tr.setNodeMarkup(pos, undefined, {
                        collapsed: state,
                    });
                    return true;
                };
            },
        };
    },
    addNodeView: function () {
        return (0, react_1.createNodeView)(component_1.OutlineListItemComponent, {
            contentDOMFactory: true,
            //  wrapperFactory: () => document.createElement("li"),
        });
    },
});
function findSublist(editor, type) {
    var _a, _b;
    var selection = editor.state.selection;
    var $from = selection.$from;
    var listItem = (0, prosemirror_utils_1.findParentNodeOfTypeClosestToPos)($from, type);
    if (!listItem)
        return false;
    var _c = __read((0, core_1.findChildren)(listItem.node, function (node) { return node.type.name === outlinelist_1.OutlineList.name; }), 1), subList = _c[0];
    if (!subList)
        return false;
    var isNested = ((_a = subList === null || subList === void 0 ? void 0 : subList.node) === null || _a === void 0 ? void 0 : _a.type.name) === outlinelist_1.OutlineList.name;
    var isCollapsed = (_b = subList === null || subList === void 0 ? void 0 : subList.node) === null || _b === void 0 ? void 0 : _b.attrs.collapsed;
    var subListPos = listItem.pos + subList.pos + 1;
    return { isCollapsed: isCollapsed, isNested: isNested, subListPos: subListPos };
    // return (
    //   this.editor
    //     .chain()
    //     .command(({ tr }) => {
    //       tr.setNodeMarkup(listItem.pos + subList.pos + 1, undefined, {
    //         collapsed: !isCollapsed,
    //       });
    //       return true;
    //     })
    //     //.setTextSelection(listItem.pos + subList.pos + 1)
    //     //.splitListItem(this.name)
    //     .run()
    // );
}
