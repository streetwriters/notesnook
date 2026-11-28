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

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const babel = require("@babel/core");
const plugin = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../tools/babel-plugin-dom-elements.js"
);

function transform(code) {
  return babel.transformSync(code, {
    babelrc: false,
    configFile: false,
    plugins: [require.resolve("@babel/plugin-syntax-jsx"), plugin]
  }).code;
}

describe("babel-plugin-dom-elements", () => {
  test("rewrites raw HTML tags to the kit's Dom elements and imports Dom", () => {
    const out = transform(
      `export const a = <Text>{x} <strong className="b">{count}</strong><span /></Text>;`
    );
    expect(out).toContain(
      `import { Dom as _Dom } from "@notesnook/ui-kit/desktop/dom";`
    );
    expect(out).toContain(`<_Dom.strong className="b">{count}</_Dom.strong>`);
    expect(out).toContain(`<_Dom.span />`);
    expect(out).toContain(`<Text>`);
  });

  test("a file with no raw tags is left as it is", () => {
    const code = `export const a = <Box><Text>hello</Text></Box>;`;
    expect(transform(code)).toBe(code);
  });

  test("br, option and unknown tags stay raw", () => {
    const out = transform(
      `export const a = <Select><option value="1">One</option><br /><canvas /><video /></Select>;`
    );
    expect(out).not.toContain("_Dom");
    expect(out).toContain(`<option value="1">`);
    expect(out).toContain(`<br />`);
    expect(out).toContain(`<canvas />`);
  });

  test("an svg is rewritten and its children are left for it to read", () => {
    const out = transform(
      `export const a = <svg style={{ width: 20 }}><use href="#themed-logo" /><path d="M0" /></svg>;`
    );
    expect(out).toContain(`<_Dom.svg style={{`);
    expect(out).toContain(`<use href="#themed-logo" />`);
    expect(out).toContain(`<path d="M0" />`);
    expect(out).toContain(`</_Dom.svg>`);
  });

  test("components and member expressions are not touched", () => {
    const out = transform(
      `const span = 1; export const a = <><Span /><Dom.div /><style>{css}</style></>;`
    );
    expect(out).toContain(`<Span />`);
    expect(out).toContain(`<Dom.div />`);
    expect(out).toContain(`<_Dom.style>{css}</_Dom.style>`);
  });

  test("the import name does not clash with a binding called _Dom", () => {
    const out = transform(`const _Dom = 1; export const a = <div>{_Dom}</div>;`);
    expect(out).toContain(`import { Dom as _Dom2 }`);
    expect(out).toContain(`<_Dom2.div>{_Dom}</_Dom2.div>`);
  });

  test("a free document is the kit's; a local, a property and typeof are not", () => {
    const out = transform(
      [
        `export const a = () => document.getElementById("select-plan")?.scrollIntoView();`,
        `export const b = typeof document !== "undefined";`,
        `export const c = (document) => document.title;`,
        `export const d = (x) => x.document;`,
        `export const e = { document: 1 };`
      ].join("\n")
    );
    expect(out).toContain(
      `import { document as _document } from "@notesnook/ui-kit/desktop/dom";`
    );
    expect(out).toContain(`_document.getElementById("select-plan")`);
    expect(out).toContain(`typeof document !== "undefined"`);
    expect(out).toContain(`document => document.title`);
    expect(out).toContain(`x.document`);
    expect(out).toContain(`document: 1`);
  });

  test("elements and document share one import", () => {
    const out = transform(
      `export const a = <div onClick={() => document.getElementById("x")} />;`
    );
    expect(out).toContain(
      `import { Dom as _Dom, document as _document } from "@notesnook/ui-kit/desktop/dom";`
    );
  });
});
