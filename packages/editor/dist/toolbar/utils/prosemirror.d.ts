import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
export declare function findSelectedDOMNode(editor: Editor, types: string[]): HTMLElement | null;
export declare function findSelectedNode(editor: Editor, type: string): Node | null;
