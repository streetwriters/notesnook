/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
// prosemirror imports
import { Schema, } from "prosemirror-model";
import { defaultBlockMathParseRules, defaultInlineMathParseRules, } from "./plugins/math-paste-rules";
////////////////////////////////////////////////////////////
// force typescript to infer generic type arguments for SchemaSpec
function createSchemaSpec(spec) {
    return spec;
}
// bare minimum ProseMirror schema for working with math nodes
export const mathSchemaSpec = createSchemaSpec({
    nodes: {
        // :: NodeSpec top-level document node
        doc: {
            content: "block+",
        },
        paragraph: {
            content: "inline*",
            group: "block",
            parseDOM: [{ tag: "p" }],
            toDOM() {
                return ["p", 0];
            },
        },
        math_inline: {
            group: "inline math",
            content: "text*",
            inline: true,
            atom: true,
            toDOM: () => ["math-inline", { class: "math-node" }, 0],
            parseDOM: [{ tag: "math-inline" }, ...defaultInlineMathParseRules],
        },
        math_display: {
            group: "block math",
            content: "text*",
            atom: true,
            code: true,
            toDOM: () => ["math-display", { class: "math-node" }, 0],
            parseDOM: [{ tag: "math-display" }, ...defaultBlockMathParseRules],
        },
        text: {
            group: "inline",
        },
    },
    marks: {
        math_select: {
            toDOM() {
                return ["math-select", 0];
            },
            parseDOM: [{ tag: "math-select" }],
        },
    },
});
/**
 * Use the prosemirror-math default SchemaSpec to create a new Schema.
 */
export function createMathSchema() {
    return new Schema(mathSchemaSpec);
}
/**
 * Create a new SchemaSpec by adding math nodes to an existing spec.

 * @deprecated This function is included for demonstration/testing only. For the
 *     time being, I highly recommend adding the math nodes manually to your own
 *     ProseMirror spec to avoid unexpected interactions between the math nodes
 *     and your own spec.  Use the example spec for reference.
 *
 * @param baseSpec The SchemaSpec to extend.  Must specify a `marks` field, and
 *     must be a raw object (not an OrderedMap).
 */
export function extendMathSchemaSpec(baseSpec) {
    let nodes = Object.assign(Object.assign({}, baseSpec.nodes), mathSchemaSpec.nodes);
    let marks = Object.assign(Object.assign({}, baseSpec.marks), mathSchemaSpec.marks);
    return { nodes, marks, topNode: baseSpec.topNode };
}
