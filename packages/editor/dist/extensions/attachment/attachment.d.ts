import { Node } from "@tiptap/core";
export interface AttachmentOptions {
    onDownloadAttachment: (attachment: Attachment) => boolean;
}
export declare type Attachment = {
    hash: string;
    filename: string;
    type: string;
    size: number;
};
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        attachment: {
            insertAttachment: (attachment: Attachment) => ReturnType;
            downloadAttachment: (attachment: Attachment) => ReturnType;
        };
    }
}
export declare const AttachmentNode: Node<AttachmentOptions, any>;
