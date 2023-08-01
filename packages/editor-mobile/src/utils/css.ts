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
import { Colors, Variants } from "@notesnook/theme";

export function removeCss(id: string): void {
  const link = document.getElementById(id);
  link?.remove();
}

export function injectCssSrc(id: string, src: string): void {
  const head = document.head;
  const link = document.createElement("link");

  link.id = id;
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = src;

  head.appendChild(link);
}

export function injectCss(rule: string): void {
  const variableCss = document.getElementById("variables-nn");
  const head = document.getElementsByTagName("head")[0];
  if (variableCss) {
    head.removeChild(variableCss);
  }
  const css = document.createElement("style");
  css.type = "text/css";
  css.id = "variables-nn";
  css.appendChild(document.createTextNode(rule));
  head.insertBefore(css, getRootStylesheet() as Node);
}

function getRootStylesheet(): HTMLStyleElement | undefined {
  for (const sty of document.getElementsByTagName("style")) {
    if (sty.innerHTML.includes("#root")) {
      return sty;
    }
  }
}

export function changeSvgTheme(newAccent: string): void {
  const nodes = document.querySelectorAll('*[fill="#0560ff"]');
  for (let n = 0; n < nodes.length; ++n)
    nodes[n].setAttribute("fill", newAccent);
}

export function transform(variants: Variants): string {
  let root = ":root {";
  for (const variant in variants) {
    const variantColors = variants[variant as keyof Variants];
    for (const color in variantColors) {
      root += `--nn_${variant}_${color}: ${
        variantColors[color as keyof Colors]
      };`;
    }
  }
  return root + "}";
}
