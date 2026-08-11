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
  [
    "ignore non-semantic attributes",
    `<p id="ignored" class="one" data-extra="x">hello world</p>`,
    `<p>hello world</p>`
  ],
  [
    "same formatting preserved",
    `<p><strong>hello</strong> world</p>`,
    `<p><strong>hello</strong> world</p>`
  ],
  [
    "same list structure",
    `<ul><li><p>item one</p></li><li><p>item two</p></li></ul>`,
    `<ul><li><p>item one</p></li><li><p>item two</p></li></ul>`
  ],
  [
    "ignore trailing empty paragraph",
    `<div>helloworld</div><p></p>`,
    `<div>helloworld</div>`
  ],
  [
    "ignore tiptap empty paragraph placeholder",
    `<div>helloworld</div><p><br/></p>`,
    `<div>helloworld</div>`
  ],
  ["ignore deeply nested empty tags", `<ul><li></li></ul>`, ``],
  [
    "image with same src",
    `<img src="./img.jpeg" />`,
    `<img id="hello" class="diff" src="./img.jpeg" />`
  ],
  [
    "link with same href and text",
    `<a href="google.com">click here</a>`,
    `<a id="hello" class="diff" href="google.com">click here</a>`
  ],
  ["case insensitive tags", `<P>hello</P>`, `<p>hello</p>`],
  ["whitespace inside semantic tags", `<p>hello   \n\n</p>`, `<p>hello</p>`]
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
  ["non-string", {}, {}],
  // formatting differences
  ["bold vs no bold", `<p><b>hello</b>world</p>`, `<p>helloworld</p>`],
  ["bold vs italic", `<p><strong>hello</strong></p>`, `<p><em>hello</em></p>`],
  ["strikethrough vs underline", `<p><s>hello</s></p>`, `<p><u>hello</u></p>`],
  ["code vs plain text", `<p><code>hello</code></p>`, `<p>hello</p>`],
  // structural differences
  ["heading vs paragraph", `<h1>Title</h1>`, `<p>Title</p>`],
  ["different heading level", `<h1>Title</h1>`, `<h2>Title</h2>`],
  [
    "ordered vs unordered list",
    `<ul><li>item</li></ul>`,
    `<ol><li>item</li></ol>`
  ],
  [
    "list item reordering",
    `<ol><li><p>first</p></li><li><p>second</p></li></ol>`,
    `<ol><li><p>second</p></li><li><p>first</p></li></ol>`
  ],
  [
    "blockquote vs paragraph",
    `<blockquote><p>quoted</p></blockquote>`,
    `<p>quoted</p>`
  ],
  [
    "br creates structural difference via text splitting",
    `<p>hello<br/>world</p>`,
    `<p>helloworld</p>`
  ],
  [
    "hr is a meaningful structural element",
    `<p>above</p><hr/><p>below</p>`,
    `<p>above</p><p>below</p>`
  ],
  // separator prevents text-node concatenation collisions
  [
    "adjacent paragraphs do not collide with single paragraph",
    `<p>foo</p><p>bar</p>`,
    `<p>foobar</p>`
  ],
  [
    "href value does not collide with adjacent text",
    `<a href="abc">def</a>ghi`,
    `<p>abcdef</p><a href="">ghi</a>`
  ],
  // link text difference
  [
    "link text changed with same href",
    `<a href="google.com">click here</a>`,
    `<a href="google.com">go there</a>`
  ]
];

describe("pairs should not be equal", () => {
  test.each(inequalPairs)("%s", (_id, one, two) => {
    expect(isHTMLEqual(one, two)).toBe(false);
  });
});
