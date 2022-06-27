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
import { NodeSelection } from "prosemirror-state";
import { ThemeProvider } from "emotion-theming";
// @ts-ignore
import { __serializeForClipboard } from "prosemirror-view";
var ReactNodeView = /** @class */ (function () {
    function ReactNodeView(node, editor, getPos, options) {
        var _this = this;
        this.editor = editor;
        this.getPos = getPos;
        this.options = options;
        this.isDragging = false;
        this.handleRef = function (node) { return _this._handleRef(node); };
        this.portalProviderAPI = editor.storage
            .portalProviderAPI;
        this.node = node;
    }
    /**
     * This method exists to move initialization logic out of the constructor,
     * so object can be initialized properly before calling render first time.
     *
     * Example:
     * Instance properties get added to an object only after super call in
     * constructor, which leads to some methods being undefined during the
     * first render.
     */
    ReactNodeView.prototype.init = function () {
        var _this = this;
        this.domRef = this.createDomRef();
        this.domRef.ondragstart = function (ev) { return _this.onDragStart(ev); };
        // this.setDomAttrs(this.node, this.domRef);
        var _a = this.getContentDOM() || {
            dom: undefined,
            contentDOM: undefined,
        }, contentDOMWrapper = _a.dom, contentDOM = _a.contentDOM;
        if (this.domRef && contentDOMWrapper) {
            this.domRef.appendChild(contentDOMWrapper);
            this.contentDOM = contentDOM ? contentDOM : contentDOMWrapper;
            this.contentDOMWrapper = contentDOMWrapper || contentDOM;
        }
        // @see ED-3790
        // something gets messed up during mutation processing inside of a
        // nodeView if DOM structure has nested plain "div"s, it doesn't see the
        // difference between them and it kills the nodeView
        this.domRef.classList.add("".concat(this.node.type.name, "-view-content-wrap"));
        this.renderReactComponent(function () {
            return _this.render(_this.options.props, _this.handleRef);
        });
        return this;
    };
    ReactNodeView.prototype.renderReactComponent = function (component) {
        if (!this.domRef || !component || !this.portalProviderAPI) {
            console.warn("Cannot render node view", this.editor.storage);
            return;
        }
        this.portalProviderAPI.render(component, this.domRef);
    };
    ReactNodeView.prototype.createDomRef = function () {
        if (this.options.wrapperFactory)
            return this.options.wrapperFactory();
        if (!this.node.isInline) {
            return document.createElement("div");
        }
        var htmlElement = document.createElement("span");
        return htmlElement;
    };
    ReactNodeView.prototype.getContentDOM = function () {
        var _a, _b;
        if (!this.options.contentDOMFactory)
            return;
        if (this.options.contentDOMFactory === true) {
            var content = document.createElement("div");
            content.classList.add("".concat(this.node.type.name.toLowerCase(), "-content-wrapper"));
            content.style.whiteSpace = "inherit";
            // caret is not visible if content element width is 0px
            content.style.minWidth = "20px";
            return { dom: content };
        }
        return (_b = (_a = this.options).contentDOMFactory) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    ReactNodeView.prototype._handleRef = function (node) {
        var contentDOM = this.contentDOMWrapper || this.contentDOM;
        // move the contentDOM node inside the inner reference after rendering
        if (node && contentDOM && !node.contains(contentDOM)) {
            node.appendChild(contentDOM);
        }
    };
    ReactNodeView.prototype.render = function (props, forwardRef) {
        var _this = this;
        if (props === void 0) { props = {}; }
        if (!this.options.component)
            return null;
        var theme = this.editor.storage.theme;
        var pos = this.getPos();
        return (_jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsx(this.options.component, __assign({}, props, { editor: this.editor, getPos: this.getPos, node: this.node, forwardRef: forwardRef, updateAttributes: function (attr) { return _this.updateAttributes(attr, pos); } })) })));
    };
    ReactNodeView.prototype.updateAttributes = function (attributes, pos) {
        var _this = this;
        this.editor.commands.command(function (_a) {
            var tr = _a.tr;
            tr.setNodeMarkup(pos, undefined, __assign(__assign({}, _this.node.attrs), attributes));
            return true;
        });
    };
    ReactNodeView.prototype.update = function (node, _decorations, _innerDecorations
    //  _innerDecorations?: Array<Decoration>,
    // validUpdate: (currentNode: PMNode, newNode: PMNode) => boolean = () => true
    ) {
        var _this = this;
        // @see https://github.com/ProseMirror/prosemirror/issues/648
        var isValidUpdate = this.node.type === node.type; // && validUpdate(this.node, node);
        if (!isValidUpdate) {
            return false;
        }
        // if (this.domRef && !this.node.sameMarkup(node)) {
        //   this.setDomAttrs(node, this.domRef);
        // }
        // View should not process a re-render if this is false.
        // We dont want to destroy the view, so we return true.
        if (!this.viewShouldUpdate(node)) {
            this.node = node;
            return true;
        }
        this.node = node;
        this.renderReactComponent(function () {
            return _this.render(_this.options.props, _this.handleRef);
        });
        return true;
    };
    ReactNodeView.prototype.onDragStart = function (event) {
        var _a, _b, _c, _d, _e, _f, _g;
        var view = this.editor.view;
        var target = event.target;
        // get the drag handle element
        // `closest` is not available for text nodes so we may have to use its parent
        var dragHandle = target.nodeType === 3
            ? (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.closest("[data-drag-handle]")
            : target.closest("[data-drag-handle]");
        if (!this.dom || ((_b = this.contentDOM) === null || _b === void 0 ? void 0 : _b.contains(target)) || !dragHandle) {
            return;
        }
        var dragImage = this.dom.querySelector("[data-drag-image]") || this.dom;
        var x = 0;
        var y = 0;
        // calculate offset for drag element if we use a different drag handle element
        if (dragImage !== dragHandle) {
            var domBox = dragImage.getBoundingClientRect();
            var handleBox = dragHandle.getBoundingClientRect();
            // In React, we have to go through nativeEvent to reach offsetX/offsetY.
            var offsetX = (_c = event.offsetX) !== null && _c !== void 0 ? _c : (_d = event.nativeEvent) === null || _d === void 0 ? void 0 : _d.offsetX;
            var offsetY = (_e = event.offsetY) !== null && _e !== void 0 ? _e : (_f = event.nativeEvent) === null || _f === void 0 ? void 0 : _f.offsetY;
            x = handleBox.x - domBox.x + offsetX;
            y = handleBox.y - domBox.y + offsetY;
        }
        // we need to tell ProseMirror that we want to move the whole node
        // so we create a NodeSelection
        var selection = NodeSelection.create(view.state.doc, this.getPos());
        var transaction = view.state.tr.setSelection(selection);
        view.dispatch(transaction);
        (_g = event.dataTransfer) === null || _g === void 0 ? void 0 : _g.setDragImage(dragImage, x, y);
        forceHandleDrag(event, this.editor);
    };
    ReactNodeView.prototype.stopEvent = function (event) {
        var _this = this;
        var _a;
        if (!this.dom) {
            return false;
        }
        // if (typeof this.options.stopEvent === 'function') {
        //   return this.options.stopEvent({ event })
        // }
        var target = event.target;
        var isInElement = this.dom.contains(target) && !((_a = this.contentDOM) === null || _a === void 0 ? void 0 : _a.contains(target));
        // any event from child nodes should be handled by ProseMirror
        if (!isInElement) {
            return false;
        }
        var isDropEvent = event.type === "drop";
        var isInput = ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target.tagName) ||
            target.isContentEditable;
        // any input event within node views should be ignored by ProseMirror
        if (isInput && !isDropEvent) {
            return true;
        }
        var isEditable = this.editor.isEditable;
        var isDragging = this.isDragging;
        var isDraggable = !!this.node.type.spec.draggable;
        var isSelectable = NodeSelection.isSelectable(this.node);
        var isCopyEvent = event.type === "copy";
        var isPasteEvent = event.type === "paste";
        var isCutEvent = event.type === "cut";
        var isClickEvent = event.type === "mousedown";
        var isDragEvent = event.type.startsWith("drag");
        // if (event instanceof DragEvent && event.dataTransfer) {
        //   console.log(
        //     `[${event.type}]:`,
        //     this.editor.view.dragging,
        //     event.dataTransfer.getData("Text"),
        //     event.dataTransfer.getData("text/plain"),
        //     event.dataTransfer.getData("text/html")
        //   );
        // }
        // ProseMirror tries to drag selectable nodes
        // even if `draggable` is set to `false`
        // this fix prevents that
        if (!isDraggable && isSelectable && isDragEvent) {
            event.preventDefault();
        }
        if (isDraggable && isDragEvent && !isDragging) {
            event.preventDefault();
            return false;
        }
        // we have to store that dragging started
        if (isDraggable && isEditable && !isDragging && isClickEvent) {
            var dragHandle = target.closest("[data-drag-handle]");
            var isValidDragHandle = dragHandle &&
                (this.dom === dragHandle || this.dom.contains(dragHandle));
            if (isValidDragHandle) {
                this.isDragging = true;
                document.addEventListener("dragend", function () {
                    _this.isDragging = false;
                }, { once: true });
                document.addEventListener("mouseup", function () {
                    _this.isDragging = false;
                }, { once: true });
            }
        }
        // these events are handled by prosemirror
        if (isDragging ||
            isDropEvent ||
            isCopyEvent ||
            isPasteEvent ||
            isCutEvent ||
            (isClickEvent && isSelectable)) {
            return false;
        }
        return true;
    };
    ReactNodeView.prototype.ignoreMutation = function (mutation) {
        if (!this.dom || !this.contentDOM) {
            return true;
        }
        // TODO if (typeof this.options.ignoreMutation === 'function') {
        //   return this.options.ignoreMutation({ mutation })
        // }
        // a leaf/atom node is like a black box for ProseMirror
        // and should be fully handled by the node view
        if (this.node.isLeaf || this.node.isAtom) {
            return true;
        }
        // ProseMirror should handle any selections
        if (mutation.type === "selection") {
            return false;
        }
        // try to prevent a bug on mobiles that will break node views on enter
        // this is because ProseMirror can’t preventDispatch on enter
        // this will lead to a re-render of the node view on enter
        // see: https://github.com/ueberdosis/tiptap/issues/1214
        if (this.dom.contains(mutation.target) &&
            mutation.type === "childList" &&
            this.editor.isFocused) {
            var changedNodes = __spreadArray(__spreadArray([], __read(Array.from(mutation.addedNodes)), false), __read(Array.from(mutation.removedNodes)), false);
            // we’ll check if every changed node is contentEditable
            // to make sure it’s probably mutated by ProseMirror
            if (changedNodes.every(function (node) { return node.isContentEditable; })) {
                return false;
            }
        }
        // we will allow mutation contentDOM with attributes
        // so we can for example adding classes within our node view
        if (this.contentDOM === mutation.target && mutation.type === "attributes") {
            return true;
        }
        // ProseMirror should handle any changes within contentDOM
        if (this.contentDOM.contains(mutation.target)) {
            return false;
        }
        return true;
    };
    ReactNodeView.prototype.viewShouldUpdate = function (nextNode) {
        if (this.options.shouldUpdate)
            return this.options.shouldUpdate(this.node, nextNode);
        return true;
    };
    /**
     * Copies the attributes from a ProseMirror Node to a DOM node.
     * @param node The Prosemirror Node from which to source the attributes
     */
    ReactNodeView.prototype.setDomAttrs = function (node, element) {
        Object.keys(node.attrs || {}).forEach(function (attr) {
            element.setAttribute(attr, node.attrs[attr]);
        });
    };
    Object.defineProperty(ReactNodeView.prototype, "dom", {
        get: function () {
            return this.domRef;
        },
        enumerable: false,
        configurable: true
    });
    ReactNodeView.prototype.destroy = function () {
        if (!this.domRef || !this.portalProviderAPI) {
            return;
        }
        this.portalProviderAPI.remove(this.domRef);
        // @ts-ignore NEW PM API
        this.domRef = undefined;
        this.contentDOM = undefined;
    };
    return ReactNodeView;
}());
export { ReactNodeView };
export function createNodeView(component, options) {
    return function (_a) {
        var node = _a.node, getPos = _a.getPos, editor = _a.editor;
        var _getPos = function () { return (typeof getPos === "boolean" ? -1 : getPos()); };
        return new ReactNodeView(node, editor, _getPos, __assign(__assign({}, options), { component: component })).init();
    };
}
// function isiOS(): boolean {
//   return (
//     [
//       "iPad Simulator",
//       "iPhone Simulator",
//       "iPod Simulator",
//       "iPad",
//       "iPhone",
//       "iPod",
//     ].includes(navigator.platform) ||
//     // iPad on iOS 13 detection
//     (navigator.userAgent.includes("Mac") && "ontouchend" in document)
//   );
// }
function forceHandleDrag(event, editor) {
    if (!event.dataTransfer)
        return;
    var view = editor.view;
    var slice = view.state.selection.content();
    var _a = __serializeForClipboard(view, slice), dom = _a.dom, text = _a.text;
    event.dataTransfer.clearData();
    event.dataTransfer.setData("Text", text);
    event.dataTransfer.setData("text/plain", text);
    event.dataTransfer.setData("text/html", dom.innerHTML);
    event.dataTransfer.effectAllowed = "copyMove";
    view.dragging = { slice: slice, move: true };
}
