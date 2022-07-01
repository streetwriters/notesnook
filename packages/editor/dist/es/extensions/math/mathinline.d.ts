import { Node } from "@tiptap/core";
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        mathInline: {
            insertMathInline: () => ReturnType;
        };
    }
}
export declare const MathInline: Node<any, any>;
