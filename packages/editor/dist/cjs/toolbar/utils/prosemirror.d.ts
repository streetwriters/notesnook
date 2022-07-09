import { Editor } from "@tiptap/core";
import { Node as ProsemirrorNode, Mark } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
export declare type NodeWithOffset = {
    node?: ProsemirrorNode;
    from: number;
    to: number;
};
export declare function findSelectedDOMNode(editor: Editor, types: string[]): HTMLElement | null;
export declare function findSelectedNode(editor: Editor, type: string): ProsemirrorNode | null;
export declare function findMark(node: ProsemirrorNode, type: string): Mark | undefined;
export declare function selectionToOffset(state: EditorState): NodeWithOffset;
export declare function findListItemType(editor: Editor): string | null;
export declare function isListActive(editor: Editor): boolean;
