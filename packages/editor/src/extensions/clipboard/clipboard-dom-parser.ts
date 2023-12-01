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

import {
  DOMParser as ProsemirrorDOMParser,
  ParseOptions
} from "@tiptap/pm/model";
import { encodeNonAsciiHTML } from "entities";
import { Schema, Slice } from "prosemirror-model";
import { inferLanguage } from "../code-block";

export class ClipboardDOMParser extends ProsemirrorDOMParser {
  static fromSchema(schema: Schema): ClipboardDOMParser {
    return (
      (schema.cached.clipboardDomParser as ClipboardDOMParser) ||
      (schema.cached.clipboardDomParser = new ClipboardDOMParser(
        schema,
        (ProsemirrorDOMParser as any).schemaRules(schema)
      ))
    );
  }

  parseSlice(dom: Node, options?: ParseOptions | undefined): Slice {
    if (dom instanceof HTMLElement) {
      formatCodeblocks(dom);
      convertBrToSingleSpacedParagraphs(dom);
    }
    return super.parseSlice(dom, options);
  }
}

export function formatCodeblocks(dom: HTMLElement | Document) {
  for (const pre of dom.querySelectorAll("pre")) {
    const codeAsText = pre.textContent;
    const languageElement = pre.querySelector(
      '[class*="language-"],[class*="lang-"]'
    );
    const language = inferLanguage(languageElement || pre);
    if (language) pre.classList.add(`language-${language}`);

    const code = document.createElement("code");
    code.innerHTML = encodeNonAsciiHTML(codeAsText || "");
    pre.replaceChildren(code);
  }

  for (const div of dom.querySelectorAll(".w3-code")) {
    div.innerHTML = div.innerHTML?.replaceAll(/<br.*?>/g, "w3-code-space");
    const codeAsText = div.textContent?.replaceAll("w3-code-space", "\n");
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.innerHTML = encodeNonAsciiHTML(codeAsText || "");
    pre.replaceChildren(code);
    div.replaceChildren(pre);
  }
}

export function convertBrToSingleSpacedParagraphs(dom: HTMLElement | Document) {
  for (const br of dom.querySelectorAll("br")) {
    let paragraph = br.closest("p");

    // if no paragraph is found over the br, we add one.
    if (!paragraph && br.parentElement) {
      const parent = br.parentElement;
      const p = document.createElement("p");
      p.append(...parent.childNodes);
      parent.append(p);
      paragraph = p;
    }

    // if paragraph is empty, we clean out the paragraph and move on.
    if (
      paragraph &&
      (paragraph.childNodes.length === 1 ||
        !paragraph.textContent ||
        paragraph.textContent.trim().length === 0)
    ) {
      paragraph.innerHTML = "";
      continue;
    }

    if (paragraph) {
      splitOn(paragraph, br);
      const children = Array.from(paragraph.childNodes.values());
      const newParagraph = document.createElement("p");
      newParagraph.dataset.spacing = "single";
      newParagraph.append(...children.slice(children.indexOf(br) + 1));
      paragraph.insertAdjacentElement("afterend", newParagraph);
      br.remove();
    }
  }
}

function splitOn(bound: Element, cutElement: Element) {
  let grandparent: ParentNode | null = null;
  for (
    let parent = cutElement.parentNode;
    bound != parent;
    parent = grandparent
  ) {
    if (parent) {
      const right = parent.cloneNode(false);
      while (cutElement.nextSibling) right.appendChild(cutElement.nextSibling);
      grandparent = parent.parentNode;
      grandparent?.insertBefore(right, parent.nextSibling);
      grandparent?.insertBefore(cutElement, right);
    }
  }
}
