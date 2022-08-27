/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

// prosemirror imports
import { Node as ProseNode } from "prosemirror-model";
import {
  Plugin as ProsePlugin,
  PluginKey,
  PluginSpec
} from "prosemirror-state";
import { MathView } from "./math-node-view";
import { EditorView } from "prosemirror-view";
import { KatexRenderer } from "./renderers/katex";

////////////////////////////////////////////////////////////

export interface IMathPluginState {
  macros: { [cmd: string]: string };
  /** A list of currently active `NodeView`s, in insertion order. */
  activeNodeViews: MathView[];
  /**
   * Used to determine whether to place the cursor in the front- or back-most
   * position when expanding a math node, without overriding the default arrow
   * key behavior.
   */
  prevCursorPos: number;
}

// uniquely identifies the prosemirror-math plugin
const MATH_PLUGIN_KEY = new PluginKey<IMathPluginState>("prosemirror-math");

/**
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @param inline TRUE for block math, FALSE for inline math.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export function createMathView(inline: boolean) {
  return (
    node: ProseNode,
    view: EditorView,
    getPos: boolean | (() => number)
  ): MathView => {
    /** @todo is this necessary?
     * Docs says that for any function proprs, the current plugin instance
     * will be bound to `this`.  However, the typings don't reflect this.
     */
    const pluginState = MATH_PLUGIN_KEY.getState(view.state);
    if (!pluginState) {
      throw new Error("no math plugin!");
    }
    const nodeViews = pluginState.activeNodeViews;

    // set up NodeView
    const nodeView = new MathView(
      node,
      view,
      getPos as () => number,
      {
        className: inline ? "math-inline" : "math-block",
        renderer: inline ? KatexRenderer.inline : KatexRenderer.block,
        tagName: inline ? "span" : "div"
      },
      MATH_PLUGIN_KEY
    );

    nodeViews.push(nodeView);
    return nodeView;
  };
}

const mathPluginSpec: PluginSpec<IMathPluginState> = {
  key: MATH_PLUGIN_KEY,
  state: {
    init() {
      return {
        macros: {},
        activeNodeViews: [],
        prevCursorPos: 0
      };
    },
    apply(_tr, value, oldState, newState) {
      // produce updated state field for this plugin
      const newPos = newState.selection.from;
      const oldPos = oldState.selection.from;

      return {
        // these values are left unchanged
        activeNodeViews: value.activeNodeViews,
        macros: value.macros,
        // update with the second-most recent cursor pos
        prevCursorPos: oldPos !== newPos ? oldPos : value.prevCursorPos
      };
    }
    /** @todo (8/21/20) implement serialization for math plugin */
    // toJSON(value) { },
    // fromJSON(config, value, state){ return {}; }
  },
  props: {
    nodeViews: {
      mathInline: createMathView(true),
      mathBlock: createMathView(false)
    }
  }
};

export const mathPlugin = new ProsePlugin(mathPluginSpec);
