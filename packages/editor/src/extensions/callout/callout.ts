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
import { getParentAttributes } from "../../utils/prosemirror.js";
import {
  InputRule,
  Node,
  findParentNodeClosestToPos,
  mergeAttributes
} from "@tiptap/core";
import { Paragraph } from "../paragraph/index.js";
import { Heading } from "../heading/index.js";
import { TextSelection } from "@tiptap/pm/state";
import { Fragment } from "@tiptap/pm/model";
import { hasPermission } from "../../types.js";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Set a code block
       */
      setCallout: (attributes: CalloutAttributes) => ReturnType;
    };
  }
}

const CALLOUT_TYPES = [
  "note",
  "abstract",
  "summary",
  "tldr",
  "info",
  "todo",
  "tip",
  "hint",
  "important",
  "success",
  "check",
  "done",
  "question",
  "help",
  "faq",
  "warning",
  "warn",
  "caution",
  "attention",
  "failure",
  "fail",
  "missing",
  "danger",
  "error",
  "bug",
  "example",
  "quote",
  "cite"
] as const;

type CalloutType = (typeof CALLOUT_TYPES)[number];
export type CalloutAttributes = {
  type: CalloutType;
};

const CALLOUT_REGEX = /^>(.+?)(?:\n| (.+)\n$)/g;
export const Callout = Node.create({
  name: "callout",
  content: "heading block*",
  group: "block",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.dataset.calloutType,
        renderHTML: (attributes) => {
          if (!attributes.type) {
            return {};
          }
          return {
            "data-callout-type": attributes.type
          };
        }
      },
      collapsed: {
        default: false,
        parseHTML: (element) => element.classList.contains("collapsed"),
        renderHTML: (attributes) => {
          if (!attributes.collapsed) {
            return {};
          }
          return {
            class: "collapsed"
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.callout"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "callout"
      }),
      0
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ tr, state }) => {
          if (!hasPermission("setCallout")) return false;

          const { selection } = state;
          const start = selection.from;
          const end = selection.to;

          const calloutTitle = attributes.type.toUpperCase();
          const content = Fragment.from(
            selection.empty
              ? state.schema.node(Paragraph.name)
              : selection.content().content
          ).addToStart(
            state.schema.node(Heading.name, { level: 4 }, [
              state.schema.text(calloutTitle)
            ])
          );

          const newNode = this.type.create(
            {
              ...getParentAttributes(this.editor),
              ...attributes
            },
            content
          );

          tr.insert(start - 1, newNode).delete(
            tr.mapping.map(start),
            tr.mapping.map(end)
          );

          tr.setSelection(
            TextSelection.create(tr.doc, tr.selection.anchor - 3)
          );

          tr.scrollIntoView();

          return true;
        }
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: CALLOUT_REGEX,
        handler: ({ state, range, match }) => {
          if (!hasPermission("setCallout", true)) return null;
          if (match.length === 1) return null;

          const calloutType = (match[1] || "info") as CalloutType;
          const calloutTitle =
            match[2] ||
            (CALLOUT_TYPES.includes(match[1] as CalloutType)
              ? match[1].toUpperCase()
              : match[1]);

          const { tr } = state;
          const start = range.from;
          const end = range.to;

          const newNode = this.type.create({ type: calloutType }, [
            state.schema.node(Heading.name, { level: 4 }, [
              state.schema.text(calloutTitle)
            ]),
            state.schema.node(Paragraph.name)
          ]);

          tr.insert(start - 1, newNode).delete(
            tr.mapping.map(start),
            tr.mapping.map(end)
          );

          tr.setSelection(
            TextSelection.create(tr.doc, tr.selection.anchor - 3)
          );

          tr.scrollIntoView();
        }
      })
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor, HTMLAttributes }) => {
      const container = document.createElement("div");

      for (const attr in HTMLAttributes) {
        container.setAttribute(attr, HTMLAttributes[attr]);
      }

      container.classList.add("callout");
      if (node.attrs.collapsed) container.classList.add("collapsed");
      else container.classList.remove("collapsed");

      function onClick(e: MouseEvent | TouchEvent) {
        if (e instanceof MouseEvent && e.button !== 0) return;
        if (!(e.target instanceof HTMLHeadingElement)) return;

        const pos = typeof getPos === "function" ? getPos() : 0;
        if (typeof pos !== "number") return;
        const resolvedPos = editor.state.doc.resolve(pos);

        const { x, y, width } = e.target.getBoundingClientRect();

        const clientX =
          e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;

        const clientY =
          e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        const hitArea = { width: 40, height: 40 };

        const isRtl =
          e.target.dir === "rtl" ||
          findParentNodeClosestToPos(
            resolvedPos,
            (node) => !!node.attrs.textDirection
          )?.node.attrs.textDirection === "rtl";

        let xEnd = clientX <= x + width;
        let xStart = clientX >= x + width - hitArea.width;

        const yStart = clientY >= y;
        const yEnd = clientY <= y + hitArea.height;

        if (isRtl) {
          xStart = clientX >= x;
          xEnd = clientX <= x + hitArea.width;
        }

        if (xStart && xEnd && yStart && yEnd) {
          e.preventDefault();
          e.stopImmediatePropagation();

          editor.commands.command(({ tr }) => {
            tr.setNodeAttribute(
              pos,
              "collapsed",
              !container.classList.contains("collapsed")
            );
            return true;
          });
        }
      }

      container.onmousedown = onClick;
      container.ontouchstart = onClick;

      return {
        dom: container,
        contentDOM: container,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          if (updatedNode.attrs.collapsed) container.classList.add("collapsed");
          else container.classList.remove("collapsed");

          return true;
        }
      };
    };
  }
});
