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

export type HtmlNode = {
  tag: string;
  children: (HtmlNode | string)[];
  attributes: Record<string, string>;
  outerHTML: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function h(
  tag: string,
  children: (HtmlNode | string)[] = [],
  attr: Record<string, string | undefined> = {}
): HtmlNode {
  const attributes: Record<string, string> = {};
  for (const key in attr) {
    const value = attr[key];
    if (value) attributes[key] = value;
  }
  const attributeString = Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join("");
  const inner = children
    .map((child) =>
      typeof child === "string" ? escapeHtml(child) : child.outerHTML
    )
    .join("");
  return {
    tag,
    children,
    attributes,
    outerHTML: `<${tag}${attributeString}>${inner}</${tag}>`
  };
}

export function text(value: string) {
  return escapeHtml(value);
}
