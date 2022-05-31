var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import { NodeView, } from "@tiptap/core";
import { ReactRenderer } from "./ReactRenderer";
import { ReactNodeViewContext, } from "./useReactNodeView";
var ReactNodeView = /** @class */ (function (_super) {
    __extends(ReactNodeView, _super);
    function ReactNodeView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ReactNodeView.prototype.mount = function () {
        var _this = this;
        var props = {
            editor: this.editor,
            node: this.node,
            decorations: this.decorations,
            selected: false,
            extension: this.extension,
            getPos: function () { return _this.getPos(); },
            updateAttributes: function (attributes) {
                if (attributes === void 0) { attributes = {}; }
                return _this.updateAttributes(attributes);
            },
            deleteNode: function () { return _this.deleteNode(); },
        };
        if (!this.component.displayName) {
            var capitalizeFirstChar = function (string) {
                return string.charAt(0).toUpperCase() + string.substring(1);
            };
            this.component.displayName = capitalizeFirstChar(this.extension.name);
        }
        var ReactNodeViewProvider = function (componentProps) {
            var Component = _this.component;
            var onDragStart = _this.onDragStart.bind(_this);
            var nodeViewContentRef = function (element) {
                if (element &&
                    _this.contentDOMElement &&
                    element.firstChild !== _this.contentDOMElement) {
                    element.appendChild(_this.contentDOMElement);
                }
            };
            return (_jsx(ReactNodeViewContext.Provider, __assign({ value: { onDragStart: onDragStart, nodeViewContentRef: nodeViewContentRef } }, { children: _jsx(Component, __assign({}, componentProps)) })));
        };
        ReactNodeViewProvider.displayName = "ReactNodeView";
        this.contentDOMElement = this.node.isLeaf
            ? null
            : document.createElement(this.node.isInline ? "span" : "div");
        if (this.contentDOMElement) {
            // For some reason the whiteSpace prop is not inherited properly in Chrome and Safari
            // With this fix it seems to work fine
            // See: https://github.com/ueberdosis/tiptap/issues/1197
            this.contentDOMElement.style.whiteSpace = "inherit";
        }
        var as = this.node.isInline ? "span" : "div";
        if (this.options.as) {
            as = this.options.as;
        }
        var _a = this.options.className, className = _a === void 0 ? "" : _a;
        this.renderer = new ReactRenderer(ReactNodeViewProvider, {
            editor: this.editor,
            props: props,
            as: as,
            className: "node-".concat(this.node.type.name, " ").concat(className).trim(),
        });
    };
    Object.defineProperty(ReactNodeView.prototype, "dom", {
        get: function () {
            var _a;
            if (this.renderer.element.firstElementChild &&
                !((_a = this.renderer.element.firstElementChild) === null || _a === void 0 ? void 0 : _a.hasAttribute("data-node-view-wrapper"))) {
                throw Error("Please use the NodeViewWrapper component for your node view.");
            }
            return this.renderer.element;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReactNodeView.prototype, "contentDOM", {
        get: function () {
            if (this.node.isLeaf) {
                return null;
            }
            return this.contentDOMElement;
        },
        enumerable: false,
        configurable: true
    });
    ReactNodeView.prototype.update = function (node, readonlyDecorations, innerDecorations) {
        var _this = this;
        var decorations = __spreadArray([], __read(readonlyDecorations), false);
        var updateProps = function (props) {
            _this.renderer.updateProps(props);
        };
        if (node.type !== this.node.type) {
            return false;
        }
        if (typeof this.options.update === "function") {
            var oldNode = this.node;
            var oldDecorations = this.decorations;
            this.node = node;
            this.decorations = decorations;
            return this.options.update({
                oldNode: oldNode,
                oldDecorations: oldDecorations,
                newNode: node,
                newDecorations: decorations,
                updateProps: function () { return updateProps({ node: node, decorations: decorations }); },
            });
        }
        if (node === this.node && this.decorations === decorations) {
            return true;
        }
        this.node = node;
        this.decorations = decorations;
        updateProps({ node: node, decorations: decorations });
        return true;
    };
    ReactNodeView.prototype.selectNode = function () {
        this.renderer.updateProps({
            selected: true,
        });
    };
    ReactNodeView.prototype.deselectNode = function () {
        this.renderer.updateProps({
            selected: false,
        });
    };
    ReactNodeView.prototype.destroy = function () {
        this.renderer.destroy();
        this.contentDOMElement = null;
    };
    return ReactNodeView;
}(NodeView));
export function ReactNodeViewRenderer(component, options) {
    return function (props) {
        // try to get the parent component
        // this is important for vue devtools to show the component hierarchy correctly
        // maybe it’s `undefined` because <editor-content> isn’t rendered yet
        if (!props.editor.contentComponent) {
            return {};
        }
        return new ReactNodeView(component, props, options);
    };
}
