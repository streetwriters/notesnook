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

import { DOMSerializer } from "@tiptap/pm/model";
import { Fragment, Schema } from "prosemirror-model";

export class ClipboardDOMSerializer extends DOMSerializer {
  static fromSchema(schema: Schema): ClipboardDOMSerializer {
    return (
      schema.cached.clipboardDomSerializer ||
      (schema.cached.clipboardDomSerializer = new ClipboardDOMSerializer(
        this.nodesFromSchema(schema),
        this.marksFromSchema(schema)
      ))
    );
  }

  serializeFragment(
    fragment: Fragment,
    options?: { document?: Document | undefined } | undefined,
    target?: HTMLElement | DocumentFragment | undefined
  ): HTMLElement | DocumentFragment {
    const dom = super.serializeFragment(fragment, options, target);
    for (const p of dom.querySelectorAll("li > p")) {
      if (p.parentElement && p.parentElement.childElementCount > 1) continue;
      p.parentElement?.append(...p.childNodes);
      p.remove();
    }

    for (const element of dom.querySelectorAll("[data-block-id]")) {
      element.removeAttribute("data-block-id");
    }

    for (const p of dom.querySelectorAll('p[data-spacing="single"]')) {
      if (!p.previousElementSibling || p.previousElementSibling.tagName !== "P")
        continue;
      if (p.previousElementSibling.childNodes.length > 0)
        p.previousElementSibling.appendChild(document.createElement("br"));
      p.previousElementSibling.append(...p.childNodes);
      p.remove();
    }

    return dom;
  }
}
