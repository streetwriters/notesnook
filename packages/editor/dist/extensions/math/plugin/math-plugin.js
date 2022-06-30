/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
import { Plugin as ProsePlugin, PluginKey, } from "prosemirror-state";
import { MathView } from "./math-node-view";
import { KatexRenderer } from "./renderers/katex";
// uniquely identifies the prosemirror-math plugin
var MATH_PLUGIN_KEY = new PluginKey("prosemirror-math");
/**
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @param inline TRUE for block math, FALSE for inline math.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export function createMathView(inline) {
    return function (node, view, getPos) {
        /** @todo is this necessary?
         * Docs says that for any function proprs, the current plugin instance
         * will be bound to `this`.  However, the typings don't reflect this.
         */
        var pluginState = MATH_PLUGIN_KEY.getState(view.state);
        if (!pluginState) {
            throw new Error("no math plugin!");
        }
        var nodeViews = pluginState.activeNodeViews;
        // set up NodeView
        var nodeView = new MathView(node, view, getPos, {
            className: inline ? "math-inline" : "math-block",
            renderer: inline ? KatexRenderer.inline : KatexRenderer.block,
            tagName: inline ? "span" : "div",
        }, MATH_PLUGIN_KEY, function () {
            nodeViews.splice(nodeViews.indexOf(nodeView));
        });
        nodeViews.push(nodeView);
        return nodeView;
    };
}
var mathPluginSpec = {
    key: MATH_PLUGIN_KEY,
    state: {
        init: function (config, instance) {
            return {
                macros: {},
                activeNodeViews: [],
                prevCursorPos: 0,
            };
        },
        apply: function (tr, value, oldState, newState) {
            // produce updated state field for this plugin
            var newPos = newState.selection.from;
            var oldPos = oldState.selection.from;
            return {
                // these values are left unchanged
                activeNodeViews: value.activeNodeViews,
                macros: value.macros,
                // update with the second-most recent cursor pos
                prevCursorPos: oldPos !== newPos ? oldPos : value.prevCursorPos,
            };
        },
        /** @todo (8/21/20) implement serialization for math plugin */
        // toJSON(value) { },
        // fromJSON(config, value, state){ return {}; }
    },
    props: {
        nodeViews: {
            mathInline: createMathView(true),
            mathBlock: createMathView(false),
        },
    },
};
export var mathPlugin = new ProsePlugin(mathPluginSpec);
