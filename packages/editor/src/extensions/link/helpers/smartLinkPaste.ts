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

import { Plugin, PluginKey } from "@tiptap/pm/state";

export function smartLinkPaste(): Plugin {
  return new Plugin({
    key: new PluginKey("smartLinkPaste"),
    props: {
      handlePaste: (view, event, slice) => {
        const clipboardData = event.clipboardData;
        const htmlContent = clipboardData?.getData("text/html");
        const textContent = clipboardData?.getData("text/plain");

        // Let browser handle real HTML links
        if (htmlContent && htmlContent.includes("<a ")) {
          console.log("HTML contains links, using default behavior");
          return false;
        }

        if (textContent) {
          // Markdown link regex
          const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

          let match: RegExpExecArray | null;
          const { schema } = view.state;
          const { tr, selection } = view.state;
          let pos = selection.from;
          let lastIndex = 0;

          while ((match = mdLinkRegex.exec(textContent)) !== null) {
            const [full, label, href] = match;

            if (match.index > lastIndex) {
              const betweenText = textContent.slice(lastIndex, match.index);
              tr.insert(pos, schema.text(betweenText));
              pos += betweenText.length;
            }

            const linkMark = schema.marks.link.create({ href });
            const linkText = schema.text(label, [linkMark]);
            tr.insert(pos, linkText);
            pos += label.length;

            lastIndex = mdLinkRegex.lastIndex;
          }

          if (lastIndex < textContent.length) {
            const remaining = textContent.slice(lastIndex);
            tr.insert(pos, schema.text(remaining));
          }

          if (tr.docChanged) {
            view.dispatch(tr);
            return true;
          }
        }

        return false;
      }
    }
  });
}
