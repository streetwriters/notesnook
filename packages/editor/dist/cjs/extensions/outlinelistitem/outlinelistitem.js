"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineListItem = void 0;
const core_1 = require("@tiptap/core");
const prosemirror_utils_1 = require("prosemirror-utils");
const commands_1 = require("../list-item/commands");
const outlinelist_1 = require("../outline-list/outlinelist");
const react_1 = require("../react");
const component_1 = require("./component");
exports.OutlineListItem = core_1.Node.create({
    name: "outlineListItem",
    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },
    content: "heading* block*",
    defining: true,
    parseHTML() {
        return [
            {
                tag: `li[data-type="${this.name}"]`,
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "li",
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": this.name,
            }),
            0,
        ];
    },
    addKeyboardShortcuts() {
        return {
            "Mod-Space": ({ editor }) => {
                const subList = findSublist(editor, this.type);
                if (!subList)
                    return false;
                const { isCollapsed, subListPos } = subList;
                return this.editor.commands.toggleOutlineCollapse(subListPos, !isCollapsed);
            },
            Enter: ({ editor }) => {
                const subList = findSublist(editor, this.type);
                if (!subList)
                    return false;
                const { isCollapsed, subListPos } = subList;
                if (isCollapsed) {
                    return this.editor.commands.toggleOutlineCollapse(subListPos, false);
                }
                return this.editor.commands.splitListItem(this.name);
            },
            Tab: () => this.editor.commands.sinkListItem(this.name),
            "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
            Backspace: ({ editor }) => (0, commands_1.onBackspacePressed)(editor, this.name, this.type),
        };
    },
    addCommands() {
        return {
            toggleOutlineCollapse: (pos, state) => ({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                    collapsed: state,
                });
                return true;
            },
        };
    },
    addNodeView() {
        return (0, react_1.createNodeView)(component_1.OutlineListItemComponent, {
            contentDOMFactory: true,
            //  wrapperFactory: () => document.createElement("li"),
        });
    },
});
function findSublist(editor, type) {
    var _a, _b;
    const { selection } = editor.state;
    const { $from } = selection;
    const listItem = (0, prosemirror_utils_1.findParentNodeOfTypeClosestToPos)($from, type);
    if (!listItem)
        return false;
    const [subList] = (0, core_1.findChildren)(listItem.node, (node) => node.type.name === outlinelist_1.OutlineList.name);
    if (!subList)
        return false;
    const isNested = ((_a = subList === null || subList === void 0 ? void 0 : subList.node) === null || _a === void 0 ? void 0 : _a.type.name) === outlinelist_1.OutlineList.name;
    const isCollapsed = (_b = subList === null || subList === void 0 ? void 0 : subList.node) === null || _b === void 0 ? void 0 : _b.attrs.collapsed;
    const subListPos = listItem.pos + subList.pos + 1;
    return { isCollapsed, isNested, subListPos };
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
