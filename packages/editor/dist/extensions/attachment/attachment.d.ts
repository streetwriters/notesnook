import { Node } from "@tiptap/core";
export interface AttachmentOptions {
    onDownloadAttachment: (attachment: Attachment) => boolean;
    onOpenAttachmentPicker: () => boolean;
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
            openAttachmentPicker: () => ReturnType;
            insertAttachment: (attachment: Attachment) => ReturnType;
            downloadAttachment: (attachment: Attachment) => ReturnType;
            setProgress: (progress: AttachmentProgress) => ReturnType;
        };
    }
}
export declare const AttachmentNode: Node<AttachmentOptions, any>;
