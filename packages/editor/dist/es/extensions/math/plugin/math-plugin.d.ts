import { Node as ProseNode } from "prosemirror-model";
import { Plugin as ProsePlugin } from "prosemirror-state";
import { MathView } from "./math-node-view";
import { EditorView } from "prosemirror-view";
export interface IMathPluginState {
    macros: {
        [cmd: string]: string;
    };
    /** A list of currently active `NodeView`s, in insertion order. */
    activeNodeViews: MathView[];
    /**
     * Used to determine whether to place the cursor in the front- or back-most
     * position when expanding a math node, without overriding the default arrow
     * key behavior.
     */
    prevCursorPos: number;
}
/**
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @param inline TRUE for block math, FALSE for inline math.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export declare function createMathView(inline: boolean): (node: ProseNode, view: EditorView, getPos: boolean | (() => number)) => MathView;
export declare const mathPlugin: ProsePlugin<IMathPluginState>;
