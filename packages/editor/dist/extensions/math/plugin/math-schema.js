/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// prosemirror imports
import { Schema, } from "prosemirror-model";
import { defaultBlockMathParseRules, defaultInlineMathParseRules, } from "./plugins/math-paste-rules";
////////////////////////////////////////////////////////////
// force typescript to infer generic type arguments for SchemaSpec
function createSchemaSpec(spec) {
    return spec;
}
// bare minimum ProseMirror schema for working with math nodes
export var mathSchemaSpec = createSchemaSpec({
    nodes: {
        // :: NodeSpec top-level document node
        doc: {
            content: "block+",
        },
        paragraph: {
            content: "inline*",
            group: "block",
            parseDOM: [{ tag: "p" }],
            toDOM: function () {
                return ["p", 0];
            },
        },
        math_inline: {
            group: "inline math",
            content: "text*",
            inline: true,
            atom: true,
            toDOM: function () { return ["math-inline", { class: "math-node" }, 0]; },
            parseDOM: __spreadArray([{ tag: "math-inline" }], __read(defaultInlineMathParseRules), false),
        },
        math_display: {
            group: "block math",
            content: "text*",
            atom: true,
            code: true,
            toDOM: function () { return ["math-display", { class: "math-node" }, 0]; },
            parseDOM: __spreadArray([{ tag: "math-display" }], __read(defaultBlockMathParseRules), false),
        },
        text: {
            group: "inline",
        },
    },
    marks: {
        math_select: {
            toDOM: function () {
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
    var nodes = __assign(__assign({}, baseSpec.nodes), mathSchemaSpec.nodes);
    var marks = __assign(__assign({}, baseSpec.marks), mathSchemaSpec.marks);
    return { nodes: nodes, marks: marks, topNode: baseSpec.topNode };
}
