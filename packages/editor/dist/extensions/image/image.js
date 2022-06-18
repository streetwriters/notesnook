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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
import { Node, nodeInputRule, mergeAttributes, findChildren, } from "@tiptap/core";
import { getDataAttribute } from "../attachment";
import { createSelectionBasedNodeView, } from "../react";
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
            float: getDataAttribute("float", false),
            align: getDataAttribute("align", "left"),
            hash: getDataAttribute("hash"),
            filename: getDataAttribute("filename"),
            type: getDataAttribute("type"),
            size: getDataAttribute("size"),
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
        return createSelectionBasedNodeView(ImageComponent);
    },
    addCommands: function () {
        var _this = this;
        return {
            insertImage: function (options) {
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
            updateImage: function (options) {
                return function (_a) {
                    var e_1, _b;
                    var state = _a.state, tr = _a.tr, dispatch = _a.dispatch;
                    var query = options.hash
                        ? { key: "hash", value: options.hash }
                        : options.src
                            ? { key: "src", value: options.src }
                            : null;
                    if (!query)
                        return false;
                    var images = findChildren(state.doc, function (node) {
                        return node.type.name === _this.name &&
                            node.attrs[query.key] === query.value;
                    });
                    try {
                        for (var images_1 = __values(images), images_1_1 = images_1.next(); !images_1_1.done; images_1_1 = images_1.next()) {
                            var image = images_1_1.value;
                            tr.setNodeMarkup(image.pos, image.node.type, __assign(__assign({}, image.node.attrs), options));
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (images_1_1 && !images_1_1.done && (_b = images_1.return)) _b.call(images_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    if (dispatch)
                        dispatch(tr);
                    return true;
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
                    var _a = __read(match, 5), alt = _a[2], src = _a[3], title = _a[4];
                    return { src: src, alt: alt, title: title };
                },
            }),
        ];
    },
});
