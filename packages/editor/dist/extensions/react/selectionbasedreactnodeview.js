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
import { jsx as _jsx } from "react/jsx-runtime";
import { DecorationSet } from "prosemirror-view";
import { NodeSelection } from "prosemirror-state";
import { stateKey as SelectionChangePluginKey, } from "./plugin";
import { ReactNodeView } from "./react-node-view";
import { ThemeProvider } from "emotion-theming";
/**
 * A ReactNodeView that handles React components sensitive
 * to selection changes.
 *
 * If the selection changes, it will attempt to re-render the
 * React component. Otherwise it does nothing.
 *
 * You can subclass `viewShouldUpdate` to include other
 * props that your component might want to consider before
 * entering the React lifecycle. These are usually props you
 * compare in `shouldComponentUpdate`.
 *
 * An example:
 *
 * ```
 * viewShouldUpdate(nextNode) {
 *   if (nextNode.attrs !== this.node.attrs) {
 *     return true;
 *   }
 *
 *   return super.viewShouldUpdate(nextNode);
 * }```
 */
var SelectionBasedNodeView = /** @class */ (function (_super) {
    __extends(SelectionBasedNodeView, _super);
    function SelectionBasedNodeView(node, editor, getPos, options) {
        var _this = _super.call(this, node, editor, getPos, options) || this;
        _this.pos = -1;
        _this.isNodeInsideSelection = function (from, to, pos, posEnd) {
            var _a;
            (_a = _this.getPositionsWithDefault(pos, posEnd), pos = _a.pos, posEnd = _a.posEnd);
            if (typeof pos !== "number" || typeof posEnd !== "number") {
                return false;
            }
            return from <= pos && to >= posEnd;
        };
        _this.isSelectionInsideNode = function (from, to, pos, posEnd) {
            var _a;
            (_a = _this.getPositionsWithDefault(pos, posEnd), pos = _a.pos, posEnd = _a.posEnd);
            if (typeof pos !== "number" || typeof posEnd !== "number") {
                return false;
            }
            return pos < from && to < posEnd;
        };
        _this.isSelectedNode = function (selection) {
            if (selection instanceof NodeSelection) {
                var _a = _this.editor.view.state.selection, from = _a.from, to = _a.to;
                return (selection.node === _this.node ||
                    // If nodes are not the same object, we check if they are referring to the same document node
                    (_this.pos === from &&
                        _this.posEnd === to &&
                        selection.node.eq(_this.node)));
            }
            return false;
        };
        _this.insideSelection = function () {
            var _a = _this.editor.view.state.selection, from = _a.from, to = _a.to;
            return (_this.isSelectedNode(_this.editor.view.state.selection) ||
                _this.isSelectionInsideNode(from, to));
        };
        _this.nodeInsideSelection = function () {
            var selection = _this.editor.view.state.selection;
            var from = selection.from, to = selection.to;
            return (_this.isSelectedNode(selection) || _this.isNodeInsideSelection(from, to));
        };
        _this.onSelectionChange = function () {
            _this.update(_this.node, [], DecorationSet.empty);
        };
        _this.updatePos();
        _this.oldSelection = editor.view.state.selection;
        _this.selectionChangeState = SelectionChangePluginKey.getState(_this.editor.view.state);
        _this.selectionChangeState.subscribe(_this.onSelectionChange);
        return _this;
    }
    SelectionBasedNodeView.prototype.render = function (props, forwardRef) {
        var _this = this;
        if (props === void 0) { props = {}; }
        if (!this.options.component)
            return null;
        var theme = this.editor.storage.theme;
        var isSelected = this.editor.isEditable &&
            (this.insideSelection() || this.nodeInsideSelection());
        return (_jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsx(this.options.component, __assign({}, props, { editor: this.editor, getPos: this.getPos, node: this.node, forwardRef: forwardRef, selected: isSelected, updateAttributes: function (attr) { return _this.updateAttributes(attr, _this.pos); } })) })));
    };
    /**
     * Update current node's start and end positions.
     *
     * Prefer `this.pos` rather than getPos(), because calling getPos is
     * expensive, unless you know you're definitely going to render.
     */
    SelectionBasedNodeView.prototype.updatePos = function () {
        if (typeof this.getPos === "boolean") {
            return;
        }
        this.pos = this.getPos();
        this.posEnd = this.pos + this.node.nodeSize;
    };
    SelectionBasedNodeView.prototype.getPositionsWithDefault = function (pos, posEnd) {
        return {
            pos: typeof pos !== "number" ? this.pos : pos,
            posEnd: typeof posEnd !== "number" ? this.posEnd : posEnd,
        };
    };
    SelectionBasedNodeView.prototype.viewShouldUpdate = function (nextNode) {
        if (_super.prototype.viewShouldUpdate.call(this, nextNode))
            return true;
        var selection = this.editor.view.state.selection;
        // update selection
        var oldSelection = this.oldSelection;
        this.oldSelection = selection;
        // update cached positions
        var _a = this, oldPos = _a.pos, oldPosEnd = _a.posEnd;
        this.updatePos();
        var from = selection.from, to = selection.to;
        var oldFrom = oldSelection.from, oldTo = oldSelection.to;
        if (this.node.type.spec.selectable) {
            var newNodeSelection = selection instanceof NodeSelection && selection.from === this.pos;
            var oldNodeSelection = oldSelection instanceof NodeSelection && oldSelection.from === this.pos;
            if ((newNodeSelection && !oldNodeSelection) ||
                (oldNodeSelection && !newNodeSelection)) {
                return true;
            }
        }
        var movedInToSelection = this.isNodeInsideSelection(from, to) &&
            !this.isNodeInsideSelection(oldFrom, oldTo);
        var movedOutOfSelection = !this.isNodeInsideSelection(from, to) &&
            this.isNodeInsideSelection(oldFrom, oldTo);
        var moveOutFromOldSelection = this.isNodeInsideSelection(from, to, oldPos, oldPosEnd) &&
            !this.isNodeInsideSelection(from, to);
        if (movedInToSelection || movedOutOfSelection || moveOutFromOldSelection) {
            return true;
        }
        return false;
    };
    SelectionBasedNodeView.prototype.destroy = function () {
        this.selectionChangeState.unsubscribe(this.onSelectionChange);
        _super.prototype.destroy.call(this);
    };
    return SelectionBasedNodeView;
}(ReactNodeView));
export { SelectionBasedNodeView };
export function createSelectionBasedNodeView(component, options) {
    return function (_a) {
        var node = _a.node, getPos = _a.getPos, editor = _a.editor;
        var _getPos = function () { return (typeof getPos === "boolean" ? -1 : getPos()); };
        return new SelectionBasedNodeView(node, editor, _getPos, __assign(__assign({}, options), { component: component })).init();
    };
}
