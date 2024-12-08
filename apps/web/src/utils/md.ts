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

import snarkdown from "snarkdown";

function addAttributes(
  html: string,
  tag: keyof HTMLElementTagNameMap,
  attributes: Record<string, string>
) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const elements = temp.querySelectorAll(tag);
  elements.forEach((element) => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  });
  return temp.innerHTML;
}

export function mdToHtml(markdown: string) {
  return addAttributes(snarkdown(markdown), "a", { target: "_blank" });
}
