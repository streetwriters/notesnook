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

const INVALID_ELEMENTS = ["script"].map((a) => a.toLowerCase());

type CloneNodeOptions = {
  images?: boolean;
  styles?: boolean;
};

export function cloneNode(node: HTMLElement, options: CloneNodeOptions) {
  const clone = node.cloneNode(true) as HTMLElement;
  processNode(clone, options);
  return clone;
}

function processNode(node: HTMLElement, options: CloneNodeOptions) {
  try {
    const tagNames = [
      "img",
      "button",
      "form",
      "select",
      "input",
      "textarea"
    ].concat(INVALID_ELEMENTS);
    const elements = node.querySelectorAll(tagNames.join(","));

    for (const element of elements) {
      if (!options.images && element instanceof HTMLImageElement) {
        element.remove();
        continue;
      }

      if (
        !options.styles &&
        (element instanceof HTMLButtonElement ||
          element instanceof HTMLFormElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement)
      ) {
        element.remove();
        continue;
      }

      if (isInvalidElement(element as HTMLElement)) {
        element.remove();
      }
    }
  } catch (e) {
    console.error("Failed to process node", e);
    return null;
  }
}

function isInvalidElement(element: HTMLElement) {
  if (!element || !element.tagName) return false;
  return INVALID_ELEMENTS.includes(element.tagName.toLowerCase());
}
