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

export type TOCItem = {
  level: number;
  title: string;
  id: string;
  top: number;
};

export function getTableOfContents(content: HTMLElement) {
  const headings = content.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const tableOfContents: TOCItem[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const level = parseInt(heading.tagName[1]);
    const title = heading.textContent;
    const id = heading.getAttribute("data-block-id");
    if (!id || !title) continue;

    tableOfContents.push({
      level,
      title,
      id,
      top: (heading as HTMLElement).offsetTop
    });
  }

  return tableOfContents;
}

export function scrollIntoViewById(id: string) {
  const element = document.querySelector(`[data-block-id="${id}"]`);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  }
}
