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
import { normalizeToHtmlBody } from "../html-parser.js";
import { expect, describe, it } from "vitest";

const HTML_INPUT_TYPES: Array<{
  title: string;
  input: string;
  expected: string;
}> = [
  {
    title: "empty input",
    input: "",
    expected: "<html><body></body></html>"
  },
  {
    title: "whitespace input",
    input: "   \n\t  ",
    expected: "<html><body></body></html>"
  },
  {
    title: "plain text",
    input: "Hello world",
    expected: "<html><body>Hello world</body></html>"
  },
  {
    title: "html fragment",
    input: "<p>Hello</p>",
    expected: "<html><body><p>Hello</p></body></html>"
  },
  {
    title: "complete html with body",
    input: "<html><body><p>Hello</p></body></html>",
    expected: "<html><body><p>Hello</p></body></html>"
  },
  {
    title: "complete html with body attributes",
    input: '<html><body class="editor" data-id="1">Hello</body></html>',
    expected: '<html><body class="editor" data-id="1">Hello</body></html>'
  },
  {
    title: "html without body",
    input: "<html><head><title>T</title></head><p>Hello</p></html>",
    expected:
      "<html><head><title>T</title></head><body><p>Hello</p></body></html>"
  },
  {
    title: "doctype html without body",
    input: "<!doctype html><html><head></head><div>Hello</div></html>",
    expected: "<html><head></head><body><div>Hello</div></body></html>"
  },
  {
    title: "body without html",
    input: "<body><p>Hello</p></body>",
    expected: "<html><body><p>Hello</p></body></html>"
  },
  {
    title: "body with attributes without html",
    input: '<body class="editor"><p>Hello</p></body>',
    expected: '<html><body class="editor"><p>Hello</p></body></html>'
  },
  {
    title: "body without closing tag",
    input: "<body><p>Hello</p>",
    expected: "<html><body><p>Hello</p></body></html>"
  },
  {
    title: "html with unclosed body",
    input: '<html><body class="editor"><p>Hello</p></html>',
    expected: '<html><body class="editor"><p>Hello</p></body></html>'
  },
  {
    title: "uppercase tags",
    input: "<HTML><BODY><p>Hello</p></BODY></HTML>",
    expected: "<html><BODY><p>Hello</p></BODY></html>"
  },
  {
    title: "orphaned closing tag",
    input: "Hello</p>World",
    expected:
      "<html><body><pre><code>Hello&lt;/p&gt;World</code></pre></body></html>"
  },
  {
    title: "unclosed tag at end",
    input: "<div><p>Hello",
    expected:
      "<html><body><pre><code>&lt;div&gt;&lt;p&gt;Hello</code></pre></body></html>"
  },
  {
    title: "mismatched closing tags",
    input: "<div><p>Hello</div></p>",
    expected: "<html><body><div><p>Hello</div></p></body></html>"
  },
  {
    title: "unclosed body tag in fragment",
    input: "<body><p>Hello</p>",
    expected: "<html><body><p>Hello</p></body></html>"
  }
];

describe("normalizeToHtmlBody", () => {
  HTML_INPUT_TYPES.forEach(({ title, input, expected }) => {
    it(`should normalize ${title}`, () => {
      expect(normalizeToHtmlBody(input)).toBe(expected);
    });
  });

  it("should always return html and body sequence at root", () => {
    for (const { input } of HTML_INPUT_TYPES) {
      const normalized = normalizeToHtmlBody(input).toLowerCase();
      expect(normalized.startsWith("<html>")).toBe(true);
      expect(normalized.includes("<body")).toBe(true);
      expect(normalized.endsWith("</body></html>")).toBe(true);
    }
  });

  it("should handle runtime non-string values safely", () => {
    expect(normalizeToHtmlBody(null as unknown as string)).toBe(
      "<html><body></body></html>"
    );
    expect(normalizeToHtmlBody(undefined as unknown as string)).toBe(
      "<html><body></body></html>"
    );
  });
});
