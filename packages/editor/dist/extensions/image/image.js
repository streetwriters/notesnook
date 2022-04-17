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
import { Node, nodeInputRule, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageComponent } from "./component";
export var inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;
export var ImageNode = Node.create({
    name: "image",
    addOptions: function () {
        return {
            inline: false,
            allowBase64: false,
            HTMLAttributes: {},
        };
    },
    inline: function () {
        return this.options.inline;
    },
    group: function () {
        return this.options.inline ? "inline" : "block";
    },
    draggable: true,
    addAttributes: function () {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            width: { default: null },
            height: { default: null },
            float: {
                default: false,
            },
            align: { default: "left" },
        };
    },
    parseHTML: function () {
        return [
            {
                tag: this.options.allowBase64
                    ? "img[src]"
                    : 'img[src]:not([src^="data:"])',
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "img",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView: function () {
        return ReactNodeViewRenderer(ImageComponent);
    },
    addCommands: function () {
        var _this = this;
        return {
            setImage: function (options) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.insertContent({
                        type: _this.name,
                        attrs: options,
                    });
                };
            },
            setImageAlignment: function (options) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.updateAttributes(_this.name, __assign({}, options));
                };
            },
            setImageSize: function (options) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.updateAttributes(_this.name, __assign({}, options));
                };
            },
        };
    },
    addInputRules: function () {
        return [
            nodeInputRule({
                find: inputRegex,
                type: this.type,
                getAttributes: function (match) {
                    var alt = match[2], src = match[3], title = match[4];
                    return { src: src, alt: alt, title: title };
                },
            }),
        ];
    },
});
