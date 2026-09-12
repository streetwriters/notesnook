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

const INVALID_ELEMENTS = ["script", "noscript"];

type CloneNodeOptions = {
  images?: boolean;
  styles?: boolean;
};

// Removes every "on*" event-handler attribute (onload, onerror, onclick,
// onpointerover, etc.) instead of matching against a fixed list of names,
// so newly introduced handler attributes are stripped too. Runs on the
// root node itself as well as all of its descendants, since querySelectorAll
// only reaches descendants.
function removeEventHandlerAttributes(root: HTMLElement) {
  const elements: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

export function cloneNode(node: HTMLElement, options: CloneNodeOptions) {
  node = node.cloneNode(true) as HTMLElement;
  const images = node.querySelectorAll("img");
  if (!options.images) {
    for (const image of images) image.remove();
  } else {
    for (const image of images) {
      image.src = image.currentSrc;
    }
  }

  if (!options.styles) {
    const elements = node.querySelectorAll(
      `button, form, select, input, textarea`
    );
    for (const element of elements) element.remove();
  }

  const invalidElements = node.querySelectorAll(INVALID_ELEMENTS.join(","));
  for (const element of invalidElements) element.remove();

  removeEventHandlerAttributes(node);

  return node;
}
