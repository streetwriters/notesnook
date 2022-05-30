import { Node } from "@tiptap/core";
import { Selection } from "prosemirror-state";
import { Node as ProsemirrorNode } from "prosemirror-model";
export declare type IndentationOptions = {
    type: "space" | "tab";
    length: number;
};
export declare type CodeBlockAttributes = {
    indentType: IndentationOptions["type"];
    indentLength: number;
    language: string;
    lines: CodeLine[];
};
export interface CodeBlockOptions {
    /**
     * Adds a prefix to language classes that are applied to code tags.
     * Defaults to `'language-'`.
     */
    languageClassPrefix: string;
    /**
     * Define whether the node should be exited on triple enter.
     * Defaults to `true`.
     */
    exitOnTripleEnter: boolean;
    /**
     * Define whether the node should be exited on arrow down if there is no node after it.
     * Defaults to `true`.
     */
    exitOnArrowDown: boolean;
    /**
     * Define whether the node should be exited on arrow up if there is no node before it.
     * Defaults to `true`.
     */
    exitOnArrowUp: boolean;
    /**
     * Custom HTML attributes that should be added to the rendered HTML tag.
     */
    HTMLAttributes: Record<string, any>;
}
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        codeblock: {
            /**
             * Set a code block
             */
            setCodeBlock: (attributes?: {
                language: string;
            }) => ReturnType;
            /**
             * Toggle a code block
             */
            toggleCodeBlock: (attributes?: {
                language: string;
            }) => ReturnType;
            /**
             * Change code block indentation options
             */
            changeCodeBlockIndentation: (options: IndentationOptions) => ReturnType;
        };
    }
}
export declare const backtickInputRegex: RegExp;
export declare const tildeInputRegex: RegExp;
export declare const CodeBlock: Node<CodeBlockOptions, any>;
export declare type CaretPosition = {
    column: number;
    line: number;
    selected?: number;
    total: number;
};
export declare function toCaretPosition(lines: CodeLine[], selection: Selection<any>): CaretPosition | undefined;
export declare function getLines(node: ProsemirrorNode<any>): CodeLine[];
declare type CodeLine = {
    index: number;
    from: number;
    to: number;
    length: number;
    text: (length?: number) => string;
};
export declare function toCodeLines(code: string, pos: number): CodeLine[];
export {};
