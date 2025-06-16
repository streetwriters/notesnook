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

const INVALID_ELEMENTS = ["script"];

type CloneNodeOptions = {
  images?: boolean;
  styles?: boolean;
};

export function cloneNode(node: HTMLElement, options: CloneNodeOptions) {
  node = node.cloneNode(true) as HTMLElement;
  if (!options.images) {
    const images = node.getElementsByTagName("img");
    for (const image of images) image.remove();
  }

  if (!options.styles) {
    const elements = node.querySelectorAll(
      `button, form, select, input, textarea`
    );
    for (const element of elements) element.remove();
  }

  const invalidElements = node.querySelectorAll(INVALID_ELEMENTS.join(","));
  for (const element of invalidElements) element.remove();
  return node;
}
