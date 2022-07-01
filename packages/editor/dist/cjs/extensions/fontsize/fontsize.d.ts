import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style";
declare type FontSizeOptions = {
    types: string[];
    defaultFontSize: number;
};
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        fontSize: {
            /**
             * Set the font family
             */
            setFontSize: (fontSize: string) => ReturnType;
            /**
             * Unset the font family
             */
            unsetFontSize: () => ReturnType;
        };
    }
}
export declare const FontSize: Extension<FontSizeOptions, any>;
export {};
