import { Schema, SchemaSpec } from "prosemirror-model";
export declare type SchemaSpecNodeT<Spec> = Spec extends SchemaSpec<infer N, infer _> ? N : never;
export declare type SchemaSpecMarkT<Spec> = Spec extends SchemaSpec<infer _, infer M> ? M : never;
export declare type SchemaNodeT<S> = S extends Schema<infer N, infer _> ? N : never;
export declare type SchemaMarkT<S> = S extends Schema<infer _, infer M> ? M : never;
