import { MarkSpec, NodeSpec, Schema, SchemaSpec } from "prosemirror-model";
import { SchemaSpecMarkT, SchemaSpecNodeT } from "./utils/types";
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
interface SchemaSpecJson<N extends string = any, M extends string = any> extends SchemaSpec<N, M> {
    nodes: {
        [name in N]: NodeSpec;
    };
    marks: {
        [name in M]: MarkSpec;
    };
    topNode?: string;
}
declare type MathSpecNodeT = SchemaSpecNodeT<typeof mathSchemaSpec>;
declare type MathSpecMarkT = SchemaSpecMarkT<typeof mathSchemaSpec>;
export declare const mathSchemaSpec: SchemaSpecJson<"paragraph" | "text" | "doc" | "math_inline" | "math_display", "math_select">;
/**
 * Use the prosemirror-math default SchemaSpec to create a new Schema.
 */
export declare function createMathSchema(): Schema<"paragraph" | "text" | "doc" | "math_inline" | "math_display", "math_select">;
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
export declare function extendMathSchemaSpec<N extends string, M extends string>(baseSpec: SchemaSpecJson<N, M>): SchemaSpecJson<N | MathSpecNodeT, M | MathSpecMarkT>;
export {};
