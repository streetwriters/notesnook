import { Node, Editor } from "@tiptap/core";
import { Attribute } from "@tiptap/core";
export declare type AttachmentType = "image" | "file";
export interface AttachmentOptions {
    HTMLAttributes: Record<string, any>;
    onDownloadAttachment: (editor: Editor, attachment: Attachment) => boolean;
    onOpenAttachmentPicker: (editor: Editor, type: AttachmentType) => boolean;
}
export declare type AttachmentWithProgress = AttachmentProgress & Attachment;
export declare type Attachment = {
    hash: string;
    filename: string;
    type: string;
    size: number;
};
export declare type AttachmentProgress = {
    progress: number;
    type: "upload" | "download" | "encrypt";
    hash: string;
};
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        attachment: {
            openAttachmentPicker: (type: AttachmentType) => ReturnType;
            insertAttachment: (attachment: Attachment) => ReturnType;
            removeAttachment: () => ReturnType;
            downloadAttachment: (attachment: Attachment) => ReturnType;
            setAttachmentProgress: (progress: AttachmentProgress) => ReturnType;
        };
    }
}
export declare const AttachmentNode: Node<AttachmentOptions, any>;
export declare function getDataAttribute(name: string, def?: any | null): Partial<Attribute>;
