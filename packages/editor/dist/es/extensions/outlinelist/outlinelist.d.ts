import { Node } from "@tiptap/core";
export declare type OutlineListAttributes = {
    collapsed: boolean;
};
export interface OutlineListOptions {
    HTMLAttributes: Record<string, any>;
}
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        outlineList: {
            /**
             * Toggle a bullet list
             */
            toggleOutlineList: () => ReturnType;
        };
    }
}
export declare const inputRegex: RegExp;
export declare const OutlineList: Node<OutlineListOptions, any>;
