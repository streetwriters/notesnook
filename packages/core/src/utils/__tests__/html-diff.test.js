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

import { isHTMLEqual } from "../html-diff.ts";
import { test, expect, describe } from "vitest";

const equalPairs = [
  [
    "ignore whitespace difference",
    `<div>hello   \n\n\n\n\n</div>\n\n\n\n\n\n`,
    `<div>hello</div>`
  ],
  ["ignore html structure", `<p><b>hello</b>world</p>`, "<p>helloworld</p>"],
  [
    "ignore attributes",
    `<p id="ignored"><b id="ignored">hello</b>world</p>`,
    "<p>helloworld</p>"
  ],
  [
    "ignore empty tags",
    "<div>helloworld</div><p></p>",
    "<div>helloworld</div>"
  ],
  ["ignore br", "<p>hello<br/>world</p><p><br/><br/></p>", "<p>helloworld</p>"],
  [
    "image with same src",
    `<img src="./img.jpeg" />`,
    `<img id="hello" class="diff" src="./img.jpeg" />`
  ],
  [
    "link with same href",
    `<a href="google.com" />`,
    `<a id="hello" class="diff" href="google.com" />`
  ]
];

describe("pairs should be equal", () => {
  test.each(equalPairs)("%s", (_id, one, two) => {
    expect(isHTMLEqual(one, two)).toBe(true);
  });
});

const inequalPairs = [
  [
    "textual difference",
    `<div>hello   \n\n\n\n\nworld</div>\n\n\n\n\n\n`,
    `<div>hello</div>`
  ],
  [
    "image with different src",
    `<img src="./img.jpeg" />`,
    `<img id="hello" class="diff" src="./img.png" />`
  ],
  [
    "link with different href",
    `<a href="brave.com" />`,
    `<a id="hello" class="diff" href="google.com" />`
  ],
  ["non-string", {}, {}]
];

describe("pairs should not be equal", () => {
  test.each(inequalPairs)("%s", (_id, one, two) => {
    expect(isHTMLEqual(one, two)).toBe(false);
  });
});
