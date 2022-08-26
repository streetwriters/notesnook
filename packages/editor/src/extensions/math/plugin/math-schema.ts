/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

// prosemirror imports
import {
  Node as ProseNode,
  Fragment,
  MarkSpec,
  NodeSpec,
  Schema,
  SchemaSpec,
  NodeType
} from "prosemirror-model";
import {
  defaultBlockMathParseRules,
  defaultInlineMathParseRules
} from "./plugins/math-paste-rules";
import { SchemaSpecMarkT, SchemaSpecNodeT } from "./utils/types";

////////////////////////////////////////////////////////////

/**
 * Borrowed from ProseMirror typings, modified to exclude OrderedMaps in spec,
 * in order to help with the schema-building functions below.
 *
 * NOTE:  TypeScript's typings for the spread operator { ...a, ...b } are only
 * an approximation to the true type, and have difficulty with optional fields.
 * So, unlike the SchemaSpec type, the `marks` field is NOT optional here.
 *
 * function example<T extends string>(x: { [name in T]: string; } | null) {
 *     const s = { ...x }; // inferred to have type `{}`.
 * }
 *
 * @see https://github.com/microsoft/TypeScript/issues/10727
 */
interface SchemaSpecJson<N extends string = any, M extends string = any>
  extends SchemaSpec<N, M> {
  nodes: { [name in N]: NodeSpec };
  marks: { [name in M]: MarkSpec };
  topNode?: string;
}

type MathSpecNodeT = SchemaSpecNodeT<typeof mathSchemaSpec>;
type MathSpecMarkT = SchemaSpecMarkT<typeof mathSchemaSpec>;

////////////////////////////////////////////////////////////

// force typescript to infer generic type arguments for SchemaSpec
function createSchemaSpec<N extends string = any, M extends string = any>(
  spec: SchemaSpecJson<N, M>
): SchemaSpecJson<N, M> {
  return spec;
}

// bare minimum ProseMirror schema for working with math nodes
export const mathSchemaSpec = createSchemaSpec({
  nodes: {
    // :: NodeSpec top-level document node
    doc: {
      content: "block+"
    },
    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return ["p", 0];
      }
    },
    math_inline: {
      group: "inline math",
      content: "text*",
      inline: true,
      atom: true,
      toDOM: () => ["math-inline", { class: "math-node" }, 0],
      parseDOM: [{ tag: "math-inline" }, ...defaultInlineMathParseRules]
    },
    math_display: {
      group: "block math",
      content: "text*",
      atom: true,
      code: true,
      toDOM: () => ["math-display", { class: "math-node" }, 0],
      parseDOM: [{ tag: "math-display" }, ...defaultBlockMathParseRules]
    },
    text: {
      group: "inline"
    }
  },
  marks: {
    math_select: {
      toDOM() {
        return ["math-select", 0];
      },
      parseDOM: [{ tag: "math-select" }]
    }
  }
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
export function extendMathSchemaSpec<N extends string, M extends string>(
  baseSpec: SchemaSpecJson<N, M>
): SchemaSpecJson<N | MathSpecNodeT, M | MathSpecMarkT> {
  let nodes = { ...baseSpec.nodes, ...mathSchemaSpec.nodes };
  let marks = { ...baseSpec.marks, ...mathSchemaSpec.marks };
  return { nodes, marks, topNode: baseSpec.topNode };
}
