import { Plugin } from "prosemirror-state";
import { dropPoint } from "prosemirror-transform";
// :: (options: ?Object) → Plugin
// Create a plugin that, when added to a ProseMirror instance,
// causes a decoration to show up at the drop position when something
// is dragged over the editor.
//
// Nodes may add a `disableDropCursor` property to their spec to
// control the showing of a drop cursor inside them. This may be a
// boolean or a function, which will be called with a view and a
// position, and should return a boolean.
//
//   options::- These options are supported:
//
//     color:: ?string
//     The color of the cursor. Defaults to `black`.
//
//     width:: ?number
//     The precise width of the cursor in pixels. Defaults to 1.
//
//     class:: ?string
//     A CSS class name to add to the cursor element.
export function dropCursor(options) {
    if (options === void 0) { options = {}; }
    return new Plugin({
        view: function (editorView) {
            return new DropCursorView(editorView, options);
        },
    });
}
var DropCursorView = /** @class */ (function () {
    function DropCursorView(editorView, options) {
        var _this = this;
        this.editorView = editorView;
        this.width = options.width || 1;
        this.color = options.color || "black";
        this.class = options.class || "";
        this.cursorPos = null;
        this.element = null;
        this.timeout = null;
        this.handlers = ["dragover", "dragend", "drop", "dragleave"].map(function (name) {
            var handler = function (e) { return _this[name](e); };
            editorView.dom.addEventListener(name, handler);
            return { name: name, handler: handler };
        });
    }
    DropCursorView.prototype.destroy = function () {
        var _this = this;
        this.handlers.forEach(function (_a) {
            var name = _a.name, handler = _a.handler;
            return _this.editorView.dom.removeEventListener(name, handler);
        });
    };
    DropCursorView.prototype.update = function (editorView, prevState) {
        if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
            if (this.cursorPos > editorView.state.doc.content.size)
                this.setCursor(null);
            else
                this.updateOverlay();
        }
    };
    DropCursorView.prototype.setCursor = function (pos) {
        if (pos == this.cursorPos)
            return;
        this.cursorPos = pos;
        if (pos == null && this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
        else {
            this.updateOverlay();
        }
    };
    DropCursorView.prototype.updateOverlay = function () {
        if (!this.cursorPos)
            return;
        var $pos = this.editorView.state.doc.resolve(this.cursorPos), rect;
        if (!$pos.parent.inlineContent) {
            var before = $pos.nodeBefore, after = $pos.nodeAfter;
            if (before || after) {
                var node = this.editorView.nodeDOM(this.cursorPos - (before ? before.nodeSize : 0));
                if (!node)
                    return;
                var nodeRect = node.getBoundingClientRect();
                var top_1 = before ? nodeRect.bottom : nodeRect.top;
                if (before && after) {
                    var cursor = this.editorView.nodeDOM(this.cursorPos);
                    if (!cursor)
                        return;
                    top_1 = (top_1 + cursor.getBoundingClientRect().top) / 2;
                }
                rect = {
                    left: nodeRect.left,
                    right: nodeRect.right,
                    top: top_1 - this.width / 2,
                    bottom: top_1 + this.width / 2,
                };
            }
        }
        if (!rect) {
            var coords = this.editorView.coordsAtPos(this.cursorPos);
            rect = {
                left: coords.left - this.width / 2,
                right: coords.left + this.width / 2,
                top: coords.top,
                bottom: coords.bottom,
            };
        }
        var parent = this.editorView.dom.offsetParent;
        if (!this.element && parent) {
            this.element = parent.appendChild(document.createElement("div"));
            if (this.class)
                this.element.className = this.class;
            this.element.style.cssText =
                "position: absolute; z-index: 50; pointer-events: none; background-color: " +
                    this.color;
        }
        var parentLeft, parentTop;
        if (!parent ||
            (parent == document.body && getComputedStyle(parent).position == "static")) {
            parentLeft = -pageXOffset;
            parentTop = -pageYOffset;
        }
        else {
            var rect_1 = parent.getBoundingClientRect();
            parentLeft = rect_1.left - parent.scrollLeft;
            parentTop = rect_1.top - parent.scrollTop;
        }
        if (!this.element)
            return;
        this.element.style.left = rect.left - parentLeft + "px";
        this.element.style.top = rect.top - parentTop + "px";
        this.element.style.width = rect.right - rect.left + "px";
        this.element.style.height = rect.bottom - rect.top + "px";
    };
    DropCursorView.prototype.scheduleRemoval = function (timeout) {
        var _this = this;
        clearTimeout(this.timeout || undefined);
        this.timeout = (setTimeout(function () { return _this.setCursor(null); }, timeout));
    };
    DropCursorView.prototype.dragover = function (event) {
        if (!this.editorView.editable)
            return;
        var pos = this.editorView.posAtCoords({
            left: event.clientX,
            top: event.clientY,
        });
        var node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
        var disableDropCursor = node && node.type.spec.disableDropCursor;
        var disabled = typeof disableDropCursor == "function"
            ? disableDropCursor(this.editorView, pos)
            : disableDropCursor;
        if (pos && !disabled) {
            var target = pos.pos;
            if (this.editorView.dragging && this.editorView.dragging.slice) {
                var point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
                if (!point)
                    return this.setCursor(null);
                target = point;
            }
            this.setCursor(target);
            this.scheduleRemoval(5000);
        }
    };
    DropCursorView.prototype.dragend = function () {
        this.scheduleRemoval(20);
    };
    DropCursorView.prototype.drop = function () {
        this.scheduleRemoval(20);
    };
    DropCursorView.prototype.dragleave = function (event) {
        if (event.target == this.editorView.dom ||
            !this.editorView.dom.contains(event.relatedTarget))
            this.setCursor(null);
    };
    return DropCursorView;
}());
