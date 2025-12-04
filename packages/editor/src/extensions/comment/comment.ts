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

import { Mark, mergeAttributes } from "@tiptap/core";

interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

export type CommentAttributes = {
  id: string;
  text: string;
  timestamp: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Set a comment mark
       */
      setComment: (attributes: CommentAttributes) => ReturnType;
      /**
       * Unset a comment mark
       */
      unsetComment: () => ReturnType;
    };
  }
}

export const Comment = Mark.create<CommentOptions>({
  name: "comment",

  priority: 1000,

  keepOnSplit: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "comment-highlight"
      }
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-comment-id": attributes.id };
        }
      },
      text: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-text"),
        renderHTML: (attributes) => {
          if (!attributes.text) return {};
          return { "data-comment-text": attributes.text };
        }
      },
      timestamp: {
        default: null,
        parseHTML: (element) => {
          const ts = element.getAttribute("data-comment-timestamp");
          return ts ? parseInt(ts, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.timestamp) return {};
          return { "data-comment-timestamp": attributes.timestamp.toString() };
        }
      }
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      setComment:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        }
    };
  }
});
