var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { Node, mergeAttributes } from "@tiptap/core";
import { createSelectionBasedNodeView, } from "../react";
import { EmbedComponent } from "./component";
export var EmbedNode = Node.create({
    name: "embed",
    content: "",
    marks: "",
    draggable: true,
    addOptions: function () {
        return {
            HTMLAttributes: {},
        };
    },
    group: function () {
        return "block";
    },
    addAttributes: function () {
        return {
            src: {
                default: null,
            },
            width: { default: null },
            height: { default: null },
            align: { default: "left" },
        };
    },
    parseHTML: function () {
        return [
            {
                tag: "iframe[src]",
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "iframe",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView: function () {
        return createSelectionBasedNodeView(EmbedComponent);
    },
    addCommands: function () {
        var _this = this;
        return {
            insertEmbed: function (options) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.insertContent({
                        type: _this.name,
                        attrs: options,
                    });
                };
            },
            setEmbedAlignment: function (options) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.updateAttributes(_this.name, __assign({}, options));
                };
            },
            setEmbedSize: function (options) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.updateAttributes(_this.name, __assign({}, options));
                };
            },
        };
    },
});
