import { Extension } from "@tiptap/core";
export interface DropcursorOptions {
    color?: string | null;
    width?: number | null;
    class?: string | null;
}
export declare const Dropcursor: Extension<DropcursorOptions, any>;
