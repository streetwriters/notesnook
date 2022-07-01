import { Node as ProseNode } from "prosemirror-model";
import { EditorState, Transaction, PluginKey } from "prosemirror-state";
import { NodeView, EditorView, Decoration, DecorationSource } from "prosemirror-view";
import { IMathPluginState } from "./math-plugin";
import { MathRenderFn } from "./renderers/types";
export interface ICursorPosObserver {
    /** indicates on which side cursor should appear when this node is selected */
    cursorSide: "start" | "end";
    /**  */
    updateCursorPos(state: EditorState): void;
}
interface IMathViewOptions {
    /** Dom element name to use for this NodeView */
    tagName?: string;
    /** Used to render the Tex input */
    renderer: MathRenderFn;
    /** Should be true if node is inline */
    className?: string;
}
export declare class MathView implements NodeView, ICursorPosObserver {
    private _node;
    private _outerView;
    private _getPos;
    dom: HTMLElement;
    private _mathRenderElt;
    private _mathSrcElt;
    private _innerView;
    cursorSide: "start" | "end";
    private _tagName;
    private _isEditing;
    private _mathPluginKey;
    private options;
    /**
     * @param onDestroy Callback for when this NodeView is destroyed.
     *     This NodeView should unregister itself from the list of ICursorPosObservers.
     *
     * Math Views support the following options:
     * @option displayMode If TRUE, will render math in display mode, otherwise in inline mode.
     * @option tagName HTML tag name to use for this NodeView.  If none is provided,
     *     will use the node name with underscores converted to hyphens.
     */
    constructor(node: ProseNode, view: EditorView, getPos: () => number, options: IMathViewOptions, mathPluginKey: PluginKey<IMathPluginState>, onDestroy?: () => void);
    destroy(): void;
    /**
     * Ensure focus on the inner editor whenever this node has focus.
     * This helps to prevent accidental deletions of math blocks.
     */
    ensureFocus(): void;
    update(node: ProseNode, _decorations: readonly Decoration[], _innerDecorations: DecorationSource): boolean;
    updateCursorPos(state: EditorState): void;
    selectNode(): void;
    deselectNode(): void;
    stopEvent(event: Event): boolean;
    ignoreMutation(): boolean;
    renderMath(): void;
    dispatchInner(tr: Transaction): void;
    openEditor(): void;
    /**
     * Called when the inner ProseMirror editor should close.
     *
     * @param render Optionally update the rendered math after closing. (which
     *    is generally what we want to do, since the user is done editing!)
     */
    closeEditor(render?: boolean): void;
}
export {};
