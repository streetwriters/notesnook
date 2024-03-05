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
    if (dom instanceof HTMLElement || dom instanceof Document) {
      formatCodeblocks(dom);
      convertBrToSingleSpacedParagraphs(dom);
    }
    return super.parseSlice(dom, options);
  }
}

export function formatCodeblocks(dom: HTMLElement | Document) {
  for (const pre of dom.querySelectorAll("pre")) {
    pre.innerHTML = pre.innerHTML?.replaceAll(/<br.*?>/g, "\n");
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
    div.innerHTML = div.innerHTML?.replaceAll(/<br.*?>/g, "\n");
    const codeAsText = div.textContent;
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

    if (!paragraph) {
      // we split and wrap all text nodes into their own single spaced
      // paragraphs
      const nodes = getSiblingTextNodes(br);
      if (nodes.length > 0) {
        paragraph = document.createElement("p");
        paragraph.dataset.spacing = "single";
        paragraph.append(...nodes);
        br.replaceWith(paragraph);
        continue;
      }

      // we convert the next pargraph into a single spaced paragraph
      if (br.nextElementSibling instanceof HTMLParagraphElement) {
        br.nextElementSibling.dataset.spacing = "single";
      }

      // just convert all br tags into single spaced paragraphs
      const newParagraph = document.createElement("p");
      newParagraph.dataset.spacing = "single";
      br.replaceWith(newParagraph);
    }

    if (
      paragraph &&
      (paragraph.childNodes.length === 1 ||
        !paragraph.textContent ||
        paragraph.textContent.trim().length === 0)
    ) {
      // if paragraph is empty, we clean out the paragraph and move on.
      paragraph.innerHTML = "";
      continue;
    }

    if (paragraph) {
      splitOn(paragraph, br);
      const children = Array.from(paragraph.childNodes);
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

function getSiblingTextNodes(element: ChildNode) {
  const siblings = [];
  let sibling: ChildNode | null = element;
  while ((sibling = sibling.previousSibling)) {
    if (sibling.nodeType === Node.ELEMENT_NODE) break;
    else if (sibling.nodeType === Node.TEXT_NODE) siblings.push(sibling);
  }
  return siblings;
}
