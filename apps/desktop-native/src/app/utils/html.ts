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

export function h(
  tag: keyof HTMLElementTagNameMap | "text",
  children: (HTMLElement | string)[] = [],
  attr: Record<string, string | undefined> = {}
) {
  const element = document.createElement(tag);
  element.append(
    ...children.map((v) =>
      typeof v === "string" ? document.createTextNode(v) : v
    )
  );
  for (const key in attr) {
    const value = attr[key];
    if (value) element.setAttribute(key, value);
  }
  return element;
}

export function text(text: string) {
  return document.createTextNode(text);
}
