import { Fragment, Node as ProsemirrorNode, Schema } from "prosemirror-model";
export declare function createTable(schema: Schema, rowsCount: number, colsCount: number, withHeaderRow: boolean, cellContent?: Fragment | ProsemirrorNode | Array<ProsemirrorNode>): ProsemirrorNode;
