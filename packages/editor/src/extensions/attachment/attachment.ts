/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Node, mergeAttributes, findChildren, Editor } from "@tiptap/core";
import { Attribute } from "@tiptap/core";
import { createSelectionBasedNodeView } from "../react";
import { AttachmentComponent } from "./component";

export type AttachmentType = "image" | "file" | "camera";
export interface AttachmentOptions {
  HTMLAttributes: Record<string, unknown>;
  onDownloadAttachment: (editor: Editor, attachment: Attachment) => boolean;
  onOpenAttachmentPicker: (editor: Editor, type: AttachmentType) => boolean;
  onPreviewAttachment: (editor: Editor, attachment: Attachment) => boolean;
}

export type AttachmentWithProgress = AttachmentProgress & Attachment;

export type Attachment = {
  hash: string;
  filename: string;
  mime: string;
  size: number;
};

export type AttachmentProgress = {
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
      previewAttachment: (options: Attachment) => ReturnType;
    };
  }
}

export const AttachmentNode = Node.create<AttachmentOptions>({
  name: "attachment",
  content: "inline*",
  marks: "",
  inline: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onDownloadAttachment: () => false,
      onOpenAttachmentPicker: () => false,
      onPreviewAttachment: () => false
    };
  },

  group() {
    return "inline";
  },

  draggable: true,

  addAttributes() {
    return {
      progress: {
        default: 0,
        rendered: false
      },
      hash: getDataAttribute("hash"),
      filename: getDataAttribute("filename"),
      mime: getDataAttribute("mime"),
      size: getDataAttribute("size")
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-hash]"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
    ];
  },

  addNodeView() {
    return createSelectionBasedNodeView(AttachmentComponent, {
      shouldUpdate: ({ attrs: prev }, { attrs: next }) => {
        return prev.progress !== next.progress;
      }
    });
  },

  addCommands() {
    return {
      insertAttachment:
        (attachment) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attachment
          });
        },
      removeAttachment:
        () =>
        ({ commands }) => {
          return commands.deleteSelection();
        },
      downloadAttachment:
        (attachment) =>
        ({ editor }) => {
          return this.options.onDownloadAttachment(editor, attachment);
        },
      openAttachmentPicker:
        (type: AttachmentType) =>
        ({ editor }) => {
          return this.options.onOpenAttachmentPicker(editor, type);
        },
      setAttachmentProgress:
        (options) =>
        ({ state, tr, dispatch }) => {
          const { hash, progress } = options;
          const attachments = findChildren(
            state.doc,
            (node) =>
              (node.type.name === this.name || node.type.name === "image") &&
              node.attrs.hash === hash
          );
          for (const attachment of attachments) {
            tr.setNodeMarkup(attachment.pos, attachment.node.type, {
              ...attachment.node.attrs,
              progress: progress === 100 ? null : progress
            });
          }
          tr.setMeta("preventUpdate", true);
          tr.setMeta("addToHistory", false);
          if (dispatch) dispatch(tr);
          return true;
        },

      previewAttachment:
        (attachment) =>
        ({ editor }) => {
          if (!this.options.onPreviewAttachment) return false;
          return this.options.onPreviewAttachment(editor, attachment);
        }
    };
  }

  //   addInputRules() {
  //     return [
  //       nodeInputRule({
  //         find: inputRegex,
  //         type: this.type,
  //         getAttributes: (match) => {
  //           const [, , alt, src, title] = match;

  //           return { src, alt, title };
  //         },
  //       }),
  //     ];
  //   },
});

export function getDataAttribute(
  name: string,
  def?: unknown | null
): Partial<Attribute> {
  return {
    default: def,
    parseHTML: (element) => element.dataset[name],
    renderHTML: (attributes) => {
      if (!attributes[name]) {
        return {};
      }

      return {
        [`data-${name}`]: attributes[name]
      };
    }
  };
}
