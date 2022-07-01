"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelectionBasedNodeView = exports.SelectionBasedNodeView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const prosemirror_view_1 = require("prosemirror-view");
const prosemirror_state_1 = require("prosemirror-state");
const plugin_1 = require("./plugin");
const reactnodeview_1 = require("./reactnodeview");
const emotion_theming_1 = require("emotion-theming");
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
class SelectionBasedNodeView extends reactnodeview_1.ReactNodeView {
    constructor(node, editor, getPos, options) {
        super(node, editor, getPos, options);
        this.pos = -1;
        this.isNodeInsideSelection = (from, to, pos, posEnd) => {
            ({ pos, posEnd } = this.getPositionsWithDefault(pos, posEnd));
            if (typeof pos !== "number" || typeof posEnd !== "number") {
                return false;
            }
            return from <= pos && to >= posEnd;
        };
        this.isSelectionInsideNode = (from, to, pos, posEnd) => {
            ({ pos, posEnd } = this.getPositionsWithDefault(pos, posEnd));
            if (typeof pos !== "number" || typeof posEnd !== "number") {
                return false;
            }
            return pos < from && to < posEnd;
        };
        this.isSelectedNode = (selection) => {
            if (selection instanceof prosemirror_state_1.NodeSelection) {
                const { selection: { from, to }, } = this.editor.view.state;
                return (selection.node === this.node ||
                    // If nodes are not the same object, we check if they are referring to the same document node
                    (this.pos === from &&
                        this.posEnd === to &&
                        selection.node.eq(this.node)));
            }
            return false;
        };
        this.insideSelection = () => {
            const { selection: { from, to }, } = this.editor.view.state;
            return (this.isSelectedNode(this.editor.view.state.selection) ||
                this.isSelectionInsideNode(from, to));
        };
        this.nodeInsideSelection = () => {
            const { selection } = this.editor.view.state;
            const { from, to } = selection;
            return (this.isSelectedNode(selection) || this.isNodeInsideSelection(from, to));
        };
        this.onSelectionChange = () => {
            this.update(this.node, [], prosemirror_view_1.DecorationSet.empty);
        };
        this.updatePos();
        this.oldSelection = editor.view.state.selection;
        this.selectionChangeState = plugin_1.stateKey.getState(this.editor.view.state);
        this.selectionChangeState.subscribe(this.onSelectionChange);
    }
    render(props = {}, forwardRef) {
        if (!this.options.component)
            return null;
        const theme = this.editor.storage.theme;
        const isSelected = this.editor.isEditable &&
            (this.insideSelection() || this.nodeInsideSelection());
        return ((0, jsx_runtime_1.jsx)(emotion_theming_1.ThemeProvider, Object.assign({ theme: theme }, { children: (0, jsx_runtime_1.jsx)(this.options.component, Object.assign({}, props, { editor: this.editor, getPos: this.getPos, node: this.node, forwardRef: forwardRef, selected: isSelected, updateAttributes: (attr) => this.updateAttributes(attr, this.pos) })) })));
    }
    /**
     * Update current node's start and end positions.
     *
     * Prefer `this.pos` rather than getPos(), because calling getPos is
     * expensive, unless you know you're definitely going to render.
     */
    updatePos() {
        if (typeof this.getPos === "boolean") {
            return;
        }
        this.pos = this.getPos();
        this.posEnd = this.pos + this.node.nodeSize;
    }
    getPositionsWithDefault(pos, posEnd) {
        return {
            pos: typeof pos !== "number" ? this.pos : pos,
            posEnd: typeof posEnd !== "number" ? this.posEnd : posEnd,
        };
    }
    viewShouldUpdate(nextNode) {
        if (super.viewShouldUpdate(nextNode))
            return true;
        const { state: { selection }, } = this.editor.view;
        // update selection
        const oldSelection = this.oldSelection;
        this.oldSelection = selection;
        // update cached positions
        const { pos: oldPos, posEnd: oldPosEnd } = this;
        this.updatePos();
        const { from, to } = selection;
        const { from: oldFrom, to: oldTo } = oldSelection;
        if (this.node.type.spec.selectable) {
            const newNodeSelection = selection instanceof prosemirror_state_1.NodeSelection && selection.from === this.pos;
            const oldNodeSelection = oldSelection instanceof prosemirror_state_1.NodeSelection && oldSelection.from === this.pos;
            if ((newNodeSelection && !oldNodeSelection) ||
                (oldNodeSelection && !newNodeSelection)) {
                return true;
            }
        }
        const movedInToSelection = this.isNodeInsideSelection(from, to) &&
            !this.isNodeInsideSelection(oldFrom, oldTo);
        const movedOutOfSelection = !this.isNodeInsideSelection(from, to) &&
            this.isNodeInsideSelection(oldFrom, oldTo);
        const moveOutFromOldSelection = this.isNodeInsideSelection(from, to, oldPos, oldPosEnd) &&
            !this.isNodeInsideSelection(from, to);
        if (movedInToSelection || movedOutOfSelection || moveOutFromOldSelection) {
            return true;
        }
        return false;
    }
    destroy() {
        this.selectionChangeState.unsubscribe(this.onSelectionChange);
        super.destroy();
    }
}
exports.SelectionBasedNodeView = SelectionBasedNodeView;
function createSelectionBasedNodeView(component, options) {
    return ({ node, getPos, editor }) => {
        const _getPos = () => (typeof getPos === "boolean" ? -1 : getPos());
        return new SelectionBasedNodeView(node, editor, _getPos, Object.assign(Object.assign({}, options), { component })).init();
    };
}
exports.createSelectionBasedNodeView = createSelectionBasedNodeView;
