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

export const DiffHighlighter = Mark.create({
  name: "diffHighlighter",

  addAttributes() {
    return {
      class: {
        rendered: true,
        keepOnSplit: false
      },
      type: {
        rendered: false
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "ins.diffins",
        attrs: { class: "diffins", type: "ins" }
      },
      {
        tag: "ins.diffmod",
        attrs: { class: "diffmod", type: "ins" }
      },
      {
        tag: "ins.mod",
        attrs: { class: "mod", type: "ins" }
      },
      {
        tag: "del.diffdel",
        attrs: { class: "diffdel", type: "del" }
      },
      {
        tag: "del.diffmod",
        attrs: { class: "diffmod", type: "del" }
      }
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    return [
      `${mark.attrs.type}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: mark.attrs.class
      }),
      0
    ];
  }
});
