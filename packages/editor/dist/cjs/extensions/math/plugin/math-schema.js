"use strict";
/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendMathSchemaSpec = exports.createMathSchema = exports.mathSchemaSpec = void 0;
// prosemirror imports
const prosemirror_model_1 = require("prosemirror-model");
const math_paste_rules_1 = require("./plugins/math-paste-rules");
////////////////////////////////////////////////////////////
// force typescript to infer generic type arguments for SchemaSpec
function createSchemaSpec(spec) {
    return spec;
}
// bare minimum ProseMirror schema for working with math nodes
exports.mathSchemaSpec = createSchemaSpec({
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
            parseDOM: [{ tag: "math-inline" }, ...math_paste_rules_1.defaultInlineMathParseRules],
        },
        math_display: {
            group: "block math",
            content: "text*",
            atom: true,
            code: true,
            toDOM: () => ["math-display", { class: "math-node" }, 0],
            parseDOM: [{ tag: "math-display" }, ...math_paste_rules_1.defaultBlockMathParseRules],
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
function createMathSchema() {
    return new prosemirror_model_1.Schema(exports.mathSchemaSpec);
}
exports.createMathSchema = createMathSchema;
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
function extendMathSchemaSpec(baseSpec) {
    let nodes = Object.assign(Object.assign({}, baseSpec.nodes), exports.mathSchemaSpec.nodes);
    let marks = Object.assign(Object.assign({}, baseSpec.marks), exports.mathSchemaSpec.marks);
    return { nodes, marks, topNode: baseSpec.topNode };
}
exports.extendMathSchemaSpec = extendMathSchemaSpec;
