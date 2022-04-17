import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style";
declare type TextDirectionOptions = {
    types: string[];
    defaultDirection: TextDirections;
};
declare type TextDirections = "ltr" | "rtl";
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        textDirection: {
            /**
             * Set the font family
             */
            setTextDirection: (direction: TextDirections) => ReturnType;
        };
    }
}
export declare const TextDirection: Extension<TextDirectionOptions, any>;
export {};
