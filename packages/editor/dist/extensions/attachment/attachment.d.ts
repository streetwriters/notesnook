import { Node } from "@tiptap/core";
export declare type AttachmentType = "image" | "file";
export interface AttachmentOptions {
    HTMLAttributes: Record<string, any>;
    onDownloadAttachment: (attachment: Attachment) => boolean;
    onOpenAttachmentPicker: (type: AttachmentType) => boolean;
}
export declare type Attachment = AttachmentProgress & {
    hash: string;
    filename: string;
    type: string;
    size: number;
};
export declare type AttachmentProgress = {
    progress: number;
    type: "upload" | "download";
    hash: string;
};
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        attachment: {
            openAttachmentPicker: (type: AttachmentType) => ReturnType;
            insertAttachment: (attachment: Attachment) => ReturnType;
            downloadAttachment: (attachment: Attachment) => ReturnType;
            setProgress: (progress: AttachmentProgress) => ReturnType;
        };
    }
}
export declare const AttachmentNode: Node<AttachmentOptions, any>;
