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
import { normalizeToHtmlBody, sanitizeHtml } from "../html-parser.js";
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

// sanitizeHtml uses globalThis.DOMParser (set to linkedom's DOMParser in
// test.setup.ts) to back DOMPurify when a native browser DOM is unavailable.
describe("sanitizeHtml", () => {
  it("strips <script> tags and their content", () => {
    const result = sanitizeHtml("<p>Hello</p><script>alert(1)</script>");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert(1)");
    expect(result).toContain("Hello");
  });

  it("strips inline event handlers", () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert(1)");
  });

  it("strips javascript: URIs from href", () => {
    // eslint-disable-next-line no-script-url
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
    expect(result).toContain("click");
  });

  it("strips javascript: URIs from src", () => {
    // eslint-disable-next-line no-script-url
    const result = sanitizeHtml(
      '<iframe src="javascript:alert(document.domain)"></iframe>'
    );
    expect(result).not.toContain("javascript:");
  });

  it("strips onclick and other on* attributes", () => {
    const result = sanitizeHtml(
      '<button onclick="evil()">OK</button><div onmouseover="evil()">x</div>'
    );
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("onmouseover");
    expect(result).not.toContain("evil()");
  });

  it("strips <object> and <embed> tags", () => {
    const result = sanitizeHtml(
      '<object data="malicious.swf"></object><embed src="evil.swf">'
    );
    expect(result).not.toContain("<object");
    expect(result).not.toContain("<embed");
  });

  it("strips data: URIs in dangerous attributes", () => {
    const result = sanitizeHtml(
      '<a href="data:text/html,<script>alert(1)</script>">x</a>'
    );
    expect(result).not.toMatch(/href=["']data:/i);
  });

  it("preserves safe block elements", () => {
    const input = "<p>Hello <strong>world</strong></p><ul><li>item</li></ul>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<p>");
    expect(result).toContain("<strong>world</strong>");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>item</li>");
  });

  it("preserves safe links with http/https href", () => {
    const result = sanitizeHtml('<a href="https://notesnook.com">Notes</a>');
    expect(result).toContain('href="https://notesnook.com"');
    expect(result).toContain("Notes");
  });

  it("preserves headings", () => {
    const result = sanitizeHtml("<h1>Title</h1><h2>Subtitle</h2>");
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain("<h2>Subtitle</h2>");
  });

  it("returns a string (not TrustedHTML or DOM node)", () => {
    const result = sanitizeHtml("<p>test</p>");
    expect(typeof result).toBe("string");
  });

  it("handles empty input without throwing", () => {
    expect(() => sanitizeHtml("")).not.toThrow();
    const result = sanitizeHtml("");
    expect(typeof result).toBe("string");
  });

  it("handles plain text without throwing", () => {
    const result = sanitizeHtml("just plain text");
    expect(result).toContain("just plain text");
    expect(typeof result).toBe("string");
  });

  it("handles deeply nested XSS attempts", () => {
    const result = sanitizeHtml(
      "<div><p><span onmouseover=\"alert('xss')\">hover</span></p></div>"
    );
    expect(result).not.toContain("onmouseover");
    expect(result).toContain("hover");
  });

  it("strips <base> tag that could hijack relative URLs", () => {
    const result = sanitizeHtml(
      '<base href="https://evil.com"><a href="/path">link</a>'
    );
    expect(result).not.toContain("<base");
  });

  it("preserves <iframe> with safe https src", () => {
    const result = sanitizeHtml('<iframe src="https://example.com"></iframe>');
    expect(result).toContain("<iframe");
    expect(result).toContain('src="https://example.com"');
  });

  it("strips src from <iframe> with javascript: URI", () => {
    // eslint-disable-next-line no-script-url
    const result = sanitizeHtml(
      '<iframe src="javascript:alert(document.domain)"></iframe>'
    );
    expect(result).toContain("<iframe");
    expect(result).not.toContain("javascript:");
  });

  it("strips src from <iframe> with data: URI", () => {
    const result = sanitizeHtml(
      '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>'
    );
    expect(result).toContain("<iframe");
    expect(result).not.toContain("data:");
  });

  it("strips srcdoc from <iframe>", () => {
    const result = sanitizeHtml(
      '<iframe srcdoc="<script>alert(1)</script>"></iframe>'
    );
    expect(result).toContain("<iframe");
    expect(result).not.toContain("srcdoc");
  });

  it("strips event handlers from <iframe>", () => {
    const result = sanitizeHtml(
      '<iframe src="https://example.com" onload="steal()"></iframe>'
    );
    expect(result).toContain("<iframe");
    expect(result).not.toContain("onload");
    expect(result).not.toContain("steal()");
  });

  it("preserves nested <iframe> with safe src alongside other elements", () => {
    const result = sanitizeHtml(
      '<div><p>Safe content</p><iframe src="https://example.com"></iframe></div>'
    );
    expect(result).toContain("Safe content");
    expect(result).toContain("<iframe");
    expect(result).toContain('src="https://example.com"');
  });
});
