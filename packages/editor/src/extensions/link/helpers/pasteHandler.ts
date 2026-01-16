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

import { Editor } from "@tiptap/core";
import { MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { find } from "linkifyjs";
import { linkRegex } from "../link";

function linkifyHtml(text: string): string {
  const links = find(text).filter((i) => i.isLink);
  let out = "";
  let lastIndex = 0;
  links.forEach((link) => {
    out += text.slice(lastIndex, link.start);
    out += `<a href="${link.href}" target="_blank" rel="noopener noreferrer nofollow">${link.value}</a>`;
    lastIndex = link.end;
  });
  out += text.slice(lastIndex);
  return out;
}

type PasteHandlerOptions = {
  editor: Editor;
  type: MarkType;
  linkOnPaste: boolean;
};

export function pasteHandler(options: PasteHandlerOptions): Plugin {
  let shiftKey = false;
  return new Plugin({
    key: new PluginKey("handlePasteLink"),
    props: {
      handleKeyDown(_, event) {
        shiftKey = event.shiftKey;
        return false;
      },
      handlePaste: (view, event, slice) => {
        if (!options.linkOnPaste) {
          return false;
        }

        const clipboardHtmlData = event.clipboardData?.getData("text/html");
        if (clipboardHtmlData) {
          return false;
        }

        const { state } = view;
        const { selection } = state;
        const { empty } = selection;

        let textContent = "";

        slice.content.forEach((node) => {
          textContent += node.textContent;
        });

        // don't deal with markdown links in this handler
        if (linkRegex.test(textContent)) {
          // reset the regex since we don't want the above test method to affect other places where the regex is used
          linkRegex.lastIndex = 0;
          return false;
        }

        if (shiftKey) {
          shiftKey = false;
          return false;
        }

        if (empty) {
          const clipboardPlainData = event.clipboardData?.getData("text/plain");
          if (clipboardPlainData) {
            const html = linkifyHtml(clipboardPlainData);
            options.editor.commands.insertContent(html);
            return true;
          }
          return false;
        }

        const link = find(textContent).find(
          (item) => item.isLink && item.value === textContent
        );

        if (!textContent || !link) {
          return false;
        }

        options.editor.commands.setMark(options.type, {
          href: link.href
        });

        return true;
      }
    }
  });
}
