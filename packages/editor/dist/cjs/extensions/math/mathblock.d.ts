import { Node } from "@tiptap/core";
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        mathBlock: {
            insertMathBlock: () => ReturnType;
        };
    }
}
export declare const MathBlock: Node<any, any>;
