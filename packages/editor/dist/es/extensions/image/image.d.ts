import { Node } from "@tiptap/core";
import { Attachment } from "../attachment";
export interface ImageOptions {
    inline: boolean;
    allowBase64: boolean;
    HTMLAttributes: Record<string, any>;
}
export declare type ImageAttributes = Partial<ImageSizeOptions> & Partial<Attachment> & {
    src: string;
    alt?: string;
    title?: string;
};
export declare type ImageAlignmentOptions = {
    float?: boolean;
    align?: "center" | "left" | "right";
};
export declare type ImageSizeOptions = {
    width: number;
    height: number;
};
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        image: {
            /**
             * Add an image
             */
            insertImage: (options: ImageAttributes) => ReturnType;
            updateImage: (options: ImageAttributes) => ReturnType;
            setImageAlignment: (options: ImageAlignmentOptions) => ReturnType;
            setImageSize: (options: ImageSizeOptions) => ReturnType;
        };
    }
}
export declare const inputRegex: RegExp;
export declare const ImageNode: Node<ImageOptions, any>;
