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

import { pluralize } from "@notesnook/common";
import { tryParse } from "./parse";

const DRAG_MIME_TYPE = "application/vnd.notesnook.items";
export function setDragData(
  dataTransfer: DataTransfer,
  type: string,
  ids: string[]
) {
  const dragImage = document.createElement("div");
  dragImage.classList.add("theme-scope-base");
  dragImage.style.position = "absolute";
  dragImage.style.top = "-1000px";
  dragImage.style.backgroundColor = "var(--background)";
  dragImage.style.color = "var(--paragraph)";
  dragImage.style.fontSize = "16px";
  dragImage.style.border = "1px solid var(--border)";
  dragImage.style.borderRadius = "5px";
  dragImage.style.paddingLeft = "5px";
  dragImage.style.paddingRight = "5px";

  dragImage.textContent = pluralize(ids.length, "item");

  document.body.appendChild(dragImage);
  dataTransfer.setDragImage(dragImage, -10, 0);

  dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify({ type: type, ids }));

  setTimeout(() => {
    dragImage.remove();
  });
}

export function getDragData(
  dataTransfer: DataTransfer,
  type: string
): string[] {
  try {
    const data = tryParse(dataTransfer.getData(DRAG_MIME_TYPE));
    if (!data || data.type !== type || !data.ids) return [];
    return data.ids;
  } catch (e) {
    console.error(e);
    return [];
  }
}
