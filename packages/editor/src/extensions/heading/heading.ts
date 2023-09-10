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

import { textblockTypeInputRule } from "@tiptap/core";
import { Heading as TiptapHeading } from "@tiptap/extension-heading";

const HEADING_REGEX = /^(#{1,6})\s$/;
export const Heading = TiptapHeading.extend({
  addCommands() {
    return {
      ...this.parent?.(),
      setHeading:
        (attributes) =>
        ({ commands, state }) => {
          if (!this.options.levels.includes(attributes.level)) {
            return false;
          }

          const { textAlign, textDirection } =
            state.selection.$from.parent.attrs;

          return commands.setNode(this.name, {
            ...attributes,
            textAlign,
            textDirection
          });
        }
    };
  },

  addKeyboardShortcuts() {
    return this.options.levels.reduce(
      (items, level) => ({
        ...items,
        ...{
          [`Mod-Alt-${level}`]: () => this.editor.commands.setHeading({ level })
        }
      }),
      {}
    );
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: HEADING_REGEX,
        type: this.type,
        getAttributes: (match) => {
          const { textAlign, textDirection } =
            this.editor.state.selection.$from.parent?.attrs || {};
          const level = match[1].length;
          return { level, textAlign, textDirection };
        }
      })
    ];
  }
});
