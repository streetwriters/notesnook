import { Node } from "@tiptap/core";
export interface EmbedOptions {
    HTMLAttributes: Record<string, any>;
}
export declare type EmbedAttributes = Partial<EmbedSizeOptions> & {
    src: string;
};
export declare type EmbedAlignmentOptions = {
    align?: "center" | "left" | "right";
};
export declare type Embed = Required<EmbedAttributes> & EmbedAlignmentOptions;
export declare type EmbedSizeOptions = {
    width: number;
    height: number;
};
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        embed: {
            /**
             * Add an embed
             */
            insertEmbed: (options: EmbedAttributes) => ReturnType;
            setEmbedAlignment: (options: EmbedAlignmentOptions) => ReturnType;
            setEmbedSize: (options: EmbedSizeOptions) => ReturnType;
            setEmbedSource: (src: string) => ReturnType;
        };
    }
}
export declare const EmbedNode: Node<EmbedOptions, any>;
