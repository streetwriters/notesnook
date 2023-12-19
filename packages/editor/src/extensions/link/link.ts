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
import { markInputRule, markPasteRule } from "@tiptap/core";
import TiptapLink from "@tiptap/extension-link";

const linkRegex = /(?:__|[*#])|\[(.*?)\]\(.*?\)/gm;
const regExp = /(?:__|[*#])|\[.*?\]\((.*?)\)/gm;

export const Link = TiptapLink.extend({
  addInputRules() {
    return [
      markInputRule({
        find: linkRegex,
        type: this.type,
        getAttributes: (match) => {
          return {
            href: regExp.exec(match[0])?.[1]
          };
        }
      })
    ];
  },
  addPasteRules() {
    return [
      markPasteRule({
        find: linkRegex,
        type: this.type,
        getAttributes(match) {
          return {
            href: regExp.exec(match[0])?.[1]
          };
        }
      })
    ];
  }
});
