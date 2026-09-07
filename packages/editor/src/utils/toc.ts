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

import { Node as ProsemirrorNode } from "@tiptap/pm/model";

export type TOCItem = {
  level: number;
  title: string;
  id: string;
  top: number;
};

function getOffsetTopRelativeTo(
  element: HTMLElement,
  ancestor: HTMLElement
): number {
  let top = 0;
  let current: HTMLElement | null = element;
  // Walk up the offsetParent chain until we reach ancestor (the editor root).
  // This correctly handles elements nested inside positioned containers such as
  // callout blocks, where `offsetTop` alone would only be relative to the
  // nearest positioned parent instead of the editor root.
  while (current && current !== ancestor) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * Builds the table of contents from the document rather than by querying the
 * rendered DOM. The document says what headings the note has; the DOM only says
 * which of them are drawn right now. The pixel offset each entry scrolls to
 * still comes from the element, found by the heading's block id.
 *
 * A callout's first child is its title, which is a heading but is not part of
 * the note's outline, so callouts are stepped over rather than looked inside.
 * Headings anywhere else -- in a quote, a list, a table cell -- are listed.
 */
export function getTableOfContents(
  doc: ProsemirrorNode,
  content: HTMLElement
): TOCItem[] {
  const tableOfContents: TOCItem[] = [];
  let level = -1;
  let prevHeading = 0;

  const visit = (node: ProsemirrorNode) => {
    if (node.type.name !== "heading") return;

    const title = node.textContent;
    const id = node.attrs.blockId as string | undefined;
    if (!id || !title) return;

    const currentHeading = (node.attrs.level as number) || 1;

    level =
      prevHeading < currentHeading
        ? level + 1
        : prevHeading > currentHeading
        ? level - (prevHeading - currentHeading)
        : level;
    level = Math.max(0, level);
    prevHeading = currentHeading;

    const element = content.querySelector<HTMLElement>(
      `[data-block-id=${JSON.stringify(id)}]`
    );

    tableOfContents.push({
      level,
      title,
      id,
      top: element ? getOffsetTopRelativeTo(element, content) : 0
    });
  };

  doc.descendants((node) => {
    if (node.type.name === "callout") return false;
    if (node.type.name !== "heading") return true;
    visit(node);
    return false;
  });

  return tableOfContents;
}

export function scrollIntoViewById(blockId: string, optionalStyles = "") {
  const element = document.querySelector<HTMLElement>(
    `.active [data-block-id=${JSON.stringify(blockId)}]`
  );

  if (element) {
    const css = `.active [data-block-id=${JSON.stringify(blockId)}] {
    background-color: var(--shade) !important;
    ${optionalStyles}
}`;
    const stylesheet = document.createElement("style");
    stylesheet.innerText = css;
    document.head.appendChild(stylesheet);
    setTimeout(() => {
      stylesheet.remove();
    }, 5000);

    setTimeout(
      () =>
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "start"
        }),
      100
    );
  }
}
