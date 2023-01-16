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

export function removeCss(id) {
  var link = document.getElementById(id);
  link.remove();
}

export function injectCssSrc(id, src) {
  var head = document.head;
  var link = document.createElement("link");

  link.id = id;
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = src;

  head.appendChild(link);
}

export function injectCss(rule) {
  let variableCss = document.getElementById("variables");
  let head = document.getElementsByTagName("head")[0];
  if (variableCss) {
    head.removeChild(variableCss);
  }
  let css = document.createElement("style");
  css.type = "text/css";
  css.id = "variables";
  // Support for IE
  if (css.styleSheet) css.styleSheet.cssText = rule;
  // Support for the rest
  else css.appendChild(document.createTextNode(rule));
  head.insertBefore(css, getRootStylesheet());
}

function getRootStylesheet() {
  for (let sty of document.getElementsByTagName("style")) {
    if (sty.innerHTML.includes("#root")) {
      return sty;
    }
  }
}

export function changeSvgTheme(newAccent) {
  var nodes = document.querySelectorAll('*[fill="#0560ff"]');
  for (var n = 0; n < nodes.length; ++n)
    nodes[n].setAttribute("fill", newAccent);
}
