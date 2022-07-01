import { Node } from "@tiptap/core";
export interface ListItemOptions {
    HTMLAttributes: Record<string, any>;
}
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        outlineListItem: {
            toggleOutlineCollapse: (subListPos: number, state: boolean) => ReturnType;
        };
    }
}
export declare const OutlineListItem: Node<ListItemOptions, any>;
