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

export function removeCss(id: string) {
  const link = document.getElementById(id);
  if(link){
    link.remove();
  }
}

export function injectCssSrc(id: string, src: string) {
  const head = document.head;
  const link = document.createElement("link");

  link.id = id;
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = src;

  head.appendChild(link);
}

export function injectCss(rule: string) {
  const variableCss = document.getElementById("variables");
  const head = document.getElementsByTagName("head")[0];
  if (variableCss) {
    head.removeChild(variableCss);
  }
  const css = document.createElement("style");
  css.type = "text/css";
  css.id = "variables";
  css.appendChild(document.createTextNode(rule));
  head.insertBefore(css, getRootStylesheet());
}

function getRootStylesheet() {
  for (const sty of document.getElementsByTagName("style")) {
    if (sty.innerHTML.includes("#root")) {
      return sty;
    }
  }
  return null;
}

export function changeSvgTheme(newAccent: string) {
  const nodes = document.querySelectorAll('*[fill="#0560ff"]');
  for (let n = 0; n < nodes.length; ++n)
    nodes[n].setAttribute("fill", newAccent);
}
