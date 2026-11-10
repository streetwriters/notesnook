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

import { describe, expect, test } from "vitest";
import { noteToTypst } from "./convert";
import { literal, unliteral } from "./escape";
import { MAX_HTML_BYTES, parseHtml } from "./html";
import { ConvertError } from "./types";

const body = async (html: string, options = {}) => {
  const note = await noteToTypst(html, options);
  return note.source.slice(note.source.indexOf("\n\n", note.source.indexOf("#show link")) + 2);
};

describe("html parser", () => {
  test("decodes entities, drops scripts and comments, closes mismatched tags", () => {
    const root = parseHtml(
      "<p>a &amp; b &lt;c&gt; &#65;&#x42;<!-- gone --><script>alert(1)</script></p><b><i>x</b>y"
    );
    expect(JSON.stringify(root)).not.toContain("alert");
    expect(JSON.stringify(root)).toContain("a & b <c> AB");
  });

  test("refuses huge and deeply nested input", () => {
    expect(() => parseHtml("x".repeat(MAX_HTML_BYTES + 1))).toThrow();
    expect(() => parseHtml("<div>".repeat(500))).toThrow(/nested/);
  });
});

describe("conversion", () => {
  test("headings, inline marks and links", async () => {
    const out = await body(
      '<h2>Title</h2><p>a <strong>bold</strong> <em>it</em> <u>u</u> <s>s</s> <a href="https://x.test/?a=1&amp;b=2">link</a></p>'
    );
    expect(out).toContain('#heading(level: 2)[#"Title"]');
    expect(out).toContain('#strong[#"bold"]');
    expect(out).toContain('#link("https://x.test/?a=1&b=2")[#"link"]');
  });

  test("javascript links lose their target", async () => {
    const out = await body('<p><a href="javascript:alert(1)">x</a></p>');
    expect(out).not.toContain("#link");
    expect(out).toContain('#"x"');
  });

  test("lists nest, ordered lists keep their start, task lists show check boxes", async () => {
    const out = await body(
      '<ul><li><p>one</p><ul><li><p>nested</p></li></ul></li></ul><ol start="3"><li><p>x</p></li></ol>' +
        '<ul class="checklist"><li class="checklist--item checked"><p>done</p></li><li class="checklist--item"><p>todo</p></li></ul>'
    );
    expect(out).toContain("#list(tight: false, [#\"one\"");
    expect(out).toContain("#list(tight: false, [#\"nested\"]");
    expect(out).toContain("#enum(start: 3,");
    expect(out).toContain("#list(marker: none");
    expect(out.match(/fill: luma\(60\)/g)?.length).toBe(1);
  });

  test("tables keep spans and header rows", async () => {
    const out = await body(
      '<table><tbody><tr><th>A</th><th>B</th></tr><tr><td colspan="2">wide</td></tr><tr><td rowspan="2">x</td><td>y</td></tr></tbody></table>'
    );
    expect(out).toContain("#table(columns: (1fr, 1fr)");
    expect(out).toContain("table.header(");
    expect(out).toContain("table.cell(colspan: 2)");
    expect(out).toContain("table.cell(rowspan: 2)");
  });

  test("code blocks keep their text and language", async () => {
    const out = await body('<pre class="language-rust"><code>fn main() {\n  "x";\n}</code></pre>');
    expect(out).toContain('lang: "rust"');
    expect(out).toContain('fn main() {\\n  \\"x\\";\\n}');
  });

  test("quotes, rules and callouts", async () => {
    const out = await body(
      '<blockquote><p>q</p></blockquote><hr><div class="callout" data-callout-type="warning"><h3>Careful</h3><p>text</p></div>'
    );
    expect(out).toContain("#quote(block: true)");
    expect(out).toContain("#line(length: 100%");
    expect(out).toContain('rgb("#f59e0b")');
    expect(out).toContain('#heading(level: 3)[#"Careful"]');
  });

  test("alignment and direction wrap a paragraph", async () => {
    const out = await body('<p style="text-align: center" dir="rtl">\u05e9\u05dc\u05d5\u05dd</p>');
    expect(out).toContain("#align(center)[#text(dir: rtl)[");
  });

  test("colours, sizes, highlights and fonts come from styles", async () => {
    const out = await body(
      '<p><span style="color: #f00; font-size: 20px; font-family: \'Fira Code\', monospace">a</span><mark data-color="#ffeb3b">b</mark></p>'
    );
    expect(out).toContain('#text(fill: rgb("#ff0000"), size: 15.0pt, font: "Fira Code")');
    expect(out).toContain('#highlight(fill: rgb("#ffeb3b"))');
  });

  test("math is converted, and falls back to marked raw LaTeX", async () => {
    const converted = await body('<p>see <span class="math-inline math-node">x^2</span></p><div class="math-block math-node">\\frac{a}{b}</div>');
    expect(converted).toContain("$x^2$");
    expect(converted).toContain("$ ");
    const raw = await noteToTypst('<p><span class="math-inline">x^2</span></p>', { math: "raw" });
    expect(raw.source).toContain('#raw("x^2")');
    expect(raw.warnings).toContain("math-not-converted");
  });

  test("math that would turn into code is not trusted", async () => {
    const out = await body('<p><span class="math-inline">\\text{#read("/etc/passwd")}</span></p>');
    expect(out.replace(/"(?:[^"\\]|\\.)*"/g, '""')).not.toMatch(/#/);
    const unsafe = await body('<p><span class="math-inline">\\sqrt{x} # y</span></p>');
    expect(unsafe).toContain("#raw(");
  });

  test("images are resolved, downscaled, named and capped", async () => {
    const calls: number[] = [];
    const note = await noteToTypst(
      '<img data-hash="h1" width="300" alt="pic"><img data-hash="missing">',
      {
        resolveImage: async ({ hash }) =>
          hash === "h1"
            ? { bytes: new Uint8Array([1, 2, 3]), mime: "image/png", width: 3000, height: 2000 }
            : null,
        prepareImage: async (image, target) => {
          calls.push(target.maxWidth);
          return { ...image, bytes: new Uint8Array([9]), mime: "image/jpeg" };
        }
      }
    );
    expect(Object.keys(note.files)).toEqual(["img-0.jpg"]);
    expect(note.source).toContain('image("img-0.jpg", width: calc.min(225.0pt, size.width)');
    expect(calls).toEqual([625]);
    expect(note.warnings).toContain("image-missing");
  });

  test("attachments become a labelled line", async () => {
    const out = await body('<p><span data-hash="h" data-filename="a.pdf" data-size="2048"></span></p>');
    expect(out).toContain("Attachment: a.pdf (2 KB)");
  });

  test("a note over the size limit is refused", async () => {
    const huge = "<p>" + "x".repeat(MAX_HTML_BYTES - 10) + "</p>";
    await expect(noteToTypst(huge + huge.slice(0, 100))).rejects.toBeInstanceOf(ConvertError);
  });
});

describe("escaping", () => {
  const MARKUP = "\\#$*_`<>@[]~/'\"=-+.:;,(){}&%!?|^0123456789 \n\t";
  const pseudo = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

  test("a literal round-trips every character", () => {
    const next = pseudo(7);
    for (let i = 0; i < 300; i++) {
      let text = "";
      for (let j = 0; j < 40; j++) {
        const r = next();
        text += r < 0.6 ? MARKUP[Math.floor(next() * MARKUP.length)] : String.fromCodePoint(Math.floor(next() * 0x2fff) + 1);
      }
      text = text.replace(/[\ud800-\udfff]/g, "");
      expect(unliteral(literal(text))).toBe(text);
    }
  });

  test("note text never becomes markup: only the skeleton survives once literals are removed", async () => {
    const next = pseudo(11);
    for (let i = 0; i < 200; i++) {
      let text = "";
      for (let j = 0; j < 30; j++) text += MARKUP[Math.floor(next() * MARKUP.length)];
      const html = `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p><h2>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</h2>`;
      const out = await body(html);
      const stripped = out.replace(/"(?:[^"\\]|\\.)*"/g, '""');
      expect(stripped.replace(/#""/g, "")).toMatch(/^(?:#heading\(level: 2\)\[\]|\s|#)*$/);
    }
  });

  test("a title with markup characters stays text", async () => {
    const note = await noteToTypst("<p>x</p>", { title: '#read("/etc/passwd") $ * "' });
    expect(note.source).toContain('#"#read(\\"/etc/passwd\\") $ * \\""');
  });
});
