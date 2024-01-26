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
import { Attachment } from "./types";

export type AttachmentType = "image" | "file" | "camera";
export interface AttachmentOptions {
  types: string[];
  HTMLAttributes: Record<string, unknown>;
  onDownloadAttachment: (editor: Editor, attachment: Attachment) => boolean;
  onOpenAttachmentPicker: (editor: Editor, type: AttachmentType) => boolean;
  onPreviewAttachment: (editor: Editor, attachment: Attachment) => boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    attachment: {
      openAttachmentPicker: (type: AttachmentType) => ReturnType;
      insertAttachment: (attachment: Attachment) => ReturnType;
      removeAttachment: () => ReturnType;
      downloadAttachment: (attachment: Attachment) => ReturnType;
      previewAttachment: (options: Attachment) => ReturnType;
      updateAttachment: (
        attachment: Partial<Attachment>,
        options: {
          preventUpdate?: boolean;
          query: (attachment: Attachment) => boolean;
        }
      ) => ReturnType;
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
      types: [this.name],
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
      type: { default: "file", rendered: false },
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
      },
      forceEnableSelection: true
    });
  },

  addCommands() {
    return {
      insertAttachment:
        (attachment) =>
        ({ commands, state }) => {
          const { $from } = state.selection;
          const maybeAttachmentNode = state.doc.nodeAt($from.pos);
          if (maybeAttachmentNode?.type === this.type) {
            return commands.insertContentAt(
              $from.pos + maybeAttachmentNode.nodeSize,
              {
                type: this.name,
                attrs: attachment
              }
            );
          }
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
      updateAttachment:
        (attachment, options) =>
        ({ state, tr, dispatch }) => {
          const attachments = findChildren(
            state.doc,
            (node) =>
              this.options.types.includes(node.type.name) &&
              options.query(node.attrs as Attachment)
          );
          if (!attachments.length) return false;

          for (const { node, pos } of attachments) {
            tr.setNodeMarkup(pos, node.type, {
              ...node.attrs,
              ...attachment
            });
          }
          tr.setMeta("preventUpdate", options.preventUpdate || false);
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
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-A": () => this.editor.commands.openAttachmentPicker("file")
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
