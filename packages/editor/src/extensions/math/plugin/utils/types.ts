import { Schema, SchemaSpec } from "prosemirror-model";

////////////////////////////////////////////////////////////////////////////////

// infer generic `Nodes` and `Marks` type parameters for a SchemaSpec
export type SchemaSpecNodeT<Spec> = Spec extends SchemaSpec<infer N, infer _>
  ? N
  : never;
export type SchemaSpecMarkT<Spec> = Spec extends SchemaSpec<infer _, infer M>
  ? M
  : never;

export type SchemaNodeT<S> = S extends Schema<infer N, infer _> ? N : never;
export type SchemaMarkT<S> = S extends Schema<infer _, infer M> ? M : never;
