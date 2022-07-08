"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeView = exports.ReactNodeView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const prosemirror_state_1 = require("prosemirror-state");
const emotion_theming_1 = require("emotion-theming");
// @ts-ignore
const prosemirror_view_1 = require("prosemirror-view");
class ReactNodeView {
    constructor(node, editor, getPos, options) {
        this.editor = editor;
        this.getPos = getPos;
        this.options = options;
        this.isDragging = false;
        this.handleRef = (node) => this._handleRef(node);
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
    init() {
        this.domRef = this.createDomRef();
        this.domRef.ondragstart = (ev) => this.onDragStart(ev);
        // this.setDomAttrs(this.node, this.domRef);
        const { dom: contentDOMWrapper, contentDOM } = this.getContentDOM() || {
            dom: undefined,
            contentDOM: undefined,
        };
        if (this.domRef && contentDOMWrapper) {
            this.domRef.appendChild(contentDOMWrapper);
            this.contentDOM = contentDOM ? contentDOM : contentDOMWrapper;
            this.contentDOMWrapper = contentDOMWrapper || contentDOM;
        }
        // @see ED-3790
        // something gets messed up during mutation processing inside of a
        // nodeView if DOM structure has nested plain "div"s, it doesn't see the
        // difference between them and it kills the nodeView
        this.domRef.classList.add(`${this.node.type.name}-view-content-wrap`);
        this.renderReactComponent(() => this.render(this.options.props, this.handleRef));
        return this;
    }
    renderReactComponent(component) {
        if (!this.domRef || !component || !this.portalProviderAPI) {
            console.warn("Cannot render node view", this.editor.storage);
            return;
        }
        this.portalProviderAPI.render(component, this.domRef);
    }
    createDomRef() {
        if (this.options.wrapperFactory)
            return this.options.wrapperFactory();
        if (!this.node.isInline) {
            return document.createElement("div");
        }
        const htmlElement = document.createElement("span");
        return htmlElement;
    }
    getContentDOM() {
        var _a, _b;
        if (!this.options.contentDOMFactory)
            return;
        if (this.options.contentDOMFactory === true) {
            const content = document.createElement("div");
            content.classList.add(`${this.node.type.name.toLowerCase()}-content-wrapper`);
            content.style.whiteSpace = "inherit";
            // caret is not visible if content element width is 0px
            content.style.minWidth = `20px`;
            return { dom: content };
        }
        return (_b = (_a = this.options).contentDOMFactory) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    _handleRef(node) {
        const contentDOM = this.contentDOMWrapper || this.contentDOM;
        // move the contentDOM node inside the inner reference after rendering
        if (node && contentDOM && !node.contains(contentDOM)) {
            node.appendChild(contentDOM);
        }
    }
    render(props = {}, forwardRef) {
        if (!this.options.component)
            return null;
        const theme = this.editor.storage.theme;
        return ((0, jsx_runtime_1.jsx)(emotion_theming_1.ThemeProvider, Object.assign({ theme: theme }, { children: (0, jsx_runtime_1.jsx)(this.options.component, Object.assign({}, props, { editor: this.editor, getPos: this.getPos, node: this.node, forwardRef: forwardRef, updateAttributes: (attr, options) => this.updateAttributes(attr, this.getPos(), options === null || options === void 0 ? void 0 : options.addToHistory, options === null || options === void 0 ? void 0 : options.preventUpdate) })) })));
    }
    updateAttributes(attributes, pos, addToHistory = false, preventUpdate = false) {
        this.editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, Object.assign(Object.assign({}, this.node.attrs), attributes));
            tr.setMeta("addToHistory", addToHistory);
            tr.setMeta("preventUpdate", preventUpdate);
            return true;
        });
    }
    update(node, _decorations, _innerDecorations
    //  _innerDecorations?: Array<Decoration>,
    // validUpdate: (currentNode: PMNode, newNode: PMNode) => boolean = () => true
    ) {
        // @see https://github.com/ProseMirror/prosemirror/issues/648
        const isValidUpdate = this.node.type === node.type; // && validUpdate(this.node, node);
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
        this.renderReactComponent(() => this.render(this.options.props, this.handleRef));
        return true;
    }
    onDragStart(event) {
        var _a, _b, _c, _d, _e, _f, _g;
        const { view } = this.editor;
        const target = event.target;
        // get the drag handle element
        // `closest` is not available for text nodes so we may have to use its parent
        const dragHandle = target.nodeType === 3
            ? (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.closest("[data-drag-handle]")
            : target.closest("[data-drag-handle]");
        if (!this.dom || ((_b = this.contentDOM) === null || _b === void 0 ? void 0 : _b.contains(target)) || !dragHandle) {
            return;
        }
        const dragImage = this.dom.querySelector("[data-drag-image]") || this.dom;
        let x = 0;
        let y = 0;
        // calculate offset for drag element if we use a different drag handle element
        if (dragImage !== dragHandle) {
            const domBox = dragImage.getBoundingClientRect();
            const handleBox = dragHandle.getBoundingClientRect();
            // In React, we have to go through nativeEvent to reach offsetX/offsetY.
            const offsetX = (_c = event.offsetX) !== null && _c !== void 0 ? _c : (_d = event.nativeEvent) === null || _d === void 0 ? void 0 : _d.offsetX;
            const offsetY = (_e = event.offsetY) !== null && _e !== void 0 ? _e : (_f = event.nativeEvent) === null || _f === void 0 ? void 0 : _f.offsetY;
            x = handleBox.x - domBox.x + offsetX;
            y = handleBox.y - domBox.y + offsetY;
        }
        // we need to tell ProseMirror that we want to move the whole node
        // so we create a NodeSelection
        const selection = prosemirror_state_1.NodeSelection.create(view.state.doc, this.getPos());
        const transaction = view.state.tr.setSelection(selection);
        view.dispatch(transaction);
        (_g = event.dataTransfer) === null || _g === void 0 ? void 0 : _g.setDragImage(dragImage, x, y);
        forceHandleDrag(event, this.editor);
    }
    stopEvent(event) {
        var _a;
        if (!this.dom) {
            return false;
        }
        // if (typeof this.options.stopEvent === 'function') {
        //   return this.options.stopEvent({ event })
        // }
        const target = event.target;
        const isInElement = this.dom.contains(target) && !((_a = this.contentDOM) === null || _a === void 0 ? void 0 : _a.contains(target));
        // any event from child nodes should be handled by ProseMirror
        if (!isInElement) {
            return false;
        }
        const isDropEvent = event.type === "drop";
        const isInput = ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target.tagName) ||
            target.isContentEditable;
        // any input event within node views should be ignored by ProseMirror
        if (isInput && !isDropEvent) {
            return true;
        }
        const { isEditable } = this.editor;
        const { isDragging } = this;
        const isDraggable = !!this.node.type.spec.draggable;
        const isSelectable = prosemirror_state_1.NodeSelection.isSelectable(this.node);
        const isCopyEvent = event.type === "copy";
        const isPasteEvent = event.type === "paste";
        const isCutEvent = event.type === "cut";
        const isClickEvent = event.type === "mousedown";
        const isDragEvent = event.type.startsWith("drag");
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
            const dragHandle = target.closest("[data-drag-handle]");
            const isValidDragHandle = dragHandle &&
                (this.dom === dragHandle || this.dom.contains(dragHandle));
            if (isValidDragHandle) {
                this.isDragging = true;
                document.addEventListener("dragend", () => {
                    this.isDragging = false;
                }, { once: true });
                document.addEventListener("mouseup", () => {
                    this.isDragging = false;
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
    }
    ignoreMutation(mutation) {
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
            const changedNodes = [
                ...Array.from(mutation.addedNodes),
                ...Array.from(mutation.removedNodes),
            ];
            // we’ll check if every changed node is contentEditable
            // to make sure it’s probably mutated by ProseMirror
            if (changedNodes.every((node) => node.isContentEditable)) {
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
    }
    viewShouldUpdate(nextNode) {
        if (this.options.shouldUpdate)
            return this.options.shouldUpdate(this.node, nextNode);
        return true;
    }
    /**
     * Copies the attributes from a ProseMirror Node to a DOM node.
     * @param node The Prosemirror Node from which to source the attributes
     */
    setDomAttrs(node, element) {
        Object.keys(node.attrs || {}).forEach((attr) => {
            element.setAttribute(attr, node.attrs[attr]);
        });
    }
    get dom() {
        return this.domRef;
    }
    destroy() {
        if (!this.domRef || !this.portalProviderAPI) {
            return;
        }
        this.portalProviderAPI.remove(this.domRef);
        // @ts-ignore NEW PM API
        this.domRef = undefined;
        this.contentDOM = undefined;
    }
}
exports.ReactNodeView = ReactNodeView;
function createNodeView(component, options) {
    return ({ node, getPos, editor }) => {
        const _getPos = () => (typeof getPos === "boolean" ? -1 : getPos());
        return new ReactNodeView(node, editor, _getPos, Object.assign(Object.assign({}, options), { component })).init();
    };
}
exports.createNodeView = createNodeView;
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
    const { view } = editor;
    const slice = view.state.selection.content();
    const { dom, text } = (0, prosemirror_view_1.__serializeForClipboard)(view, slice);
    event.dataTransfer.clearData();
    event.dataTransfer.setData("Text", text);
    event.dataTransfer.setData("text/plain", text);
    event.dataTransfer.setData("text/html", dom.innerHTML);
    event.dataTransfer.effectAllowed = "copyMove";
    view.dragging = { slice, move: true };
}
