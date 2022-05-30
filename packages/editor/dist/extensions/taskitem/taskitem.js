import { mergeAttributes } from "@tiptap/core";
import { TaskItem } from "@tiptap/extension-task-item";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TaskItemComponent } from "./component";
export var TaskItemNode = TaskItem.extend({
    draggable: true,
    addAttributes: function () {
        return {
            checked: {
                default: false,
                keepOnSplit: false,
                parseHTML: function (element) { return element.classList.contains("checked"); },
                renderHTML: function (attributes) { return ({
                    class: attributes.checked ? "checked" : "",
                }); },
            },
        };
    },
    renderHTML: function (_a) {
        var node = _a.node, HTMLAttributes = _a.HTMLAttributes;
        return [
            "li",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: "checklist--item",
            }),
            0,
        ];
    },
    parseHTML: function () {
        return [
            {
                tag: "li",
                getAttrs: function (node) {
                    var _a;
                    if (node instanceof Node && node instanceof HTMLElement) {
                        return ((node.classList.contains("checklist--item") ||
                            ((_a = node.parentElement) === null || _a === void 0 ? void 0 : _a.classList.contains("checklist"))) &&
                            null);
                    }
                    return false;
                },
                priority: 51,
            },
        ];
    },
    // renderHTML({ node, HTMLAttributes }) {
    //   return [
    //     'li',
    //     mergeAttributes(
    //       this.options.HTMLAttributes,
    //       HTMLAttributes,
    //       { 'data-type': this.name },
    //     ),
    //     [
    //       'label',
    //       [
    //         'input',
    //         {
    //           type: 'checkbox',
    //           checked: node.attrs.checked
    //             ? 'checked'
    //             : null,
    //         },
    //       ],
    //       ['span'],
    //     ],
    //     [
    //       'div',
    //       0,
    //     ],
    //   ]
    // },
    addNodeView: function () {
        return ReactNodeViewRenderer(TaskItemComponent);
    },
});
