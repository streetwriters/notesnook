/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
// prosemirror imports
import { Plugin as ProsePlugin, } from "prosemirror-state";
import { DecorationSet, Decoration } from "prosemirror-view";
////////////////////////////////////////////////////////////
/**
 * Uses the selection to determine which math_select decorations
 * should be applied to the given document.
 * @param arg Should be either a Transaction or an EditorState,
 *     although any object with `selection` and `doc` will work.
 */
const checkSelection = (arg) => {
    let { from, to } = arg.selection;
    let content = arg.selection.content().content;
    let result = [];
    content.descendants((node, pos, parent) => {
        if (node.type.name == "text") {
            return false;
        }
        if (node.type.name.startsWith("math_")) {
            result.push({
                start: Math.max(from + pos - 1, 0),
                end: from + pos + node.nodeSize - 1,
            });
            return false;
        }
        return true;
    });
    return DecorationSet.create(arg.doc, result.map(({ start, end }) => Decoration.node(start, end, { class: "math-select" })));
};
/**
 * Due to the internals of KaTeX, by default, selecting rendered
 * math will put a box around each individual character of a
 * math expression.  This plugin attempts to make math selections
 * slightly prettier by instead setting a background color on the node.
 *
 * (remember to use the included math.css!)
 *
 * @todo (6/13/20) math selection rectangles are not quite even with text
 */
export const mathSelectPlugin = new ProsePlugin({
    state: {
        init(config, partialState) {
            return checkSelection(partialState);
        },
        apply(tr, value, oldState, newState) {
            if (!tr.selection || !tr.selectionSet) {
                return oldState;
            }
            let sel = checkSelection(tr);
            return sel;
        },
    },
    props: {
        decorations: (state) => {
            return mathSelectPlugin.getState(state);
        },
    },
});
