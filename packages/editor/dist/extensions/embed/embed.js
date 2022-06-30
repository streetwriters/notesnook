"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedNode = void 0;
var core_1 = require("@tiptap/core");
var react_1 = require("../react");
var component_1 = require("./component");
exports.EmbedNode = core_1.Node.create({
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
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView: function () {
        return (0, react_1.createSelectionBasedNodeView)(component_1.EmbedComponent);
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
            setEmbedSource: function (src) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.updateAttributes(_this.name, { src: src });
                };
            },
        };
    },
});
