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

export const HighlightDiff = {
  Insert: Mark.create({
    name: "Insert",
    parseHTML() {
      return [
        {
          tag: "ins.diffins"
        }
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "ins",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: "diffins"
        }),
        0
      ];
    }
  }),
  DiffMod: Mark.create({
    name: "DiffMod",
    parseHTML() {
      return [
        {
          tag: "ins.diffmod"
        }
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "ins",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: "diffmod"
        }),
        0
      ];
    }
  }),
  Mod: Mark.create({
    name: "Mod",
    parseHTML() {
      return [
        {
          tag: "ins.mod"
        }
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "ins",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: "mod"
        }),
        0
      ];
    }
  }),
  Del: Mark.create({
    name: "Del",
    parseHTML() {
      return [
        {
          tag: "del.diffdel"
        }
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "del",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: "diffdel"
        }),
        0
      ];
    }
  }),
  DelMod: Mark.create({
    name: "DelMod",
    parseHTML() {
      return [
        {
          tag: "del.diffmod"
        }
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "del",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: "del"
        }),
        0
      ];
    }
  })
};
