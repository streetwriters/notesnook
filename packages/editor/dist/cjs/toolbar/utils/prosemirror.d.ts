import { Editor } from "@tiptap/core";
import { Node, Mark } from "prosemirror-model";
import { Selection } from "prosemirror-state";
export declare type NodeWithOffset = {
    node: Node;
    from: number;
    to: number;
};
export declare function findSelectedDOMNode(editor: Editor, types: string[]): HTMLElement | null;
export declare function findSelectedNode(editor: Editor, type: string): Node | null;
export declare function findMark(node: Node, type: string): Mark | undefined;
export declare function selectionToOffset(selection: Selection): NodeWithOffset;
export declare function findListItemType(editor: Editor): string | null;
export declare function isListActive(editor: Editor): boolean;
