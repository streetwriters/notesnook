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

/**
 * The dialogs are copied from apps/web with only their imports changed, and
 * the desktop type-check has the DOM library, so a browser global or a raw
 * HTML element in them type-checks and then fails on the native host. This
 * test finds them: a dialog may use `window`, `FormData`, `IS_DESKTOP_APP`
 * and the like only when it imports that name (from ./desktop-bridge or the
 * kit), and may draw only the lowercase (HTML) JSX elements the desktop build
 * rewrites to the kit's (tools/babel-plugin-dom-elements.js). `document` is
 * rewritten by that plugin too, to the kit's.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const here = path.dirname(new URL(import.meta.url).pathname);

const GLOBALS = new Set([
  "window",
  "navigator",
  "localStorage",
  "FormData",
  "IS_DESKTOP_APP",
  "IS_TESTING"
]);
const { TAGS } = createRequire(import.meta.url)(
  "../../../tools/babel-plugin-dom-elements.js"
) as { TAGS: Set<string> };
// `option` and `br` are read by the kit's Select and Text from their
// children; `use` and `path` by the svg element.
const ALLOWED_INTRINSICS = new Set([
  ...TAGS,
  "option",
  "optgroup",
  "br",
  "use",
  "path"
]);

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [file]
      : [];
  });
}

/** Browser globals read without an import, and lowercase JSX elements. */
function findProblems(source: string, file: string) {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const imported = new Set<string>();
  const globals = new Set<string>();
  const elements = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isImportSpecifier(node) || ts.isImportClause(node)) {
      if (node.name) imported.add(node.name.text);
    } else if (
      ts.isJsxOpeningElement(node) ||
      ts.isJsxSelfClosingElement(node)
    ) {
      const tag = node.tagName.getText(sf);
      if (/^[a-z][\w-]*$/.test(tag) && !ALLOWED_INTRINSICS.has(tag)) elements.add(tag);
    } else if (ts.isIdentifier(node) && GLOBALS.has(node.text)) {
      const parent = node.parent;
      const isName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isPropertySignature(parent) && parent.name === node) ||
        ts.isImportSpecifier(parent) ||
        ts.isTypeReferenceNode(parent) ||
        ts.isTypeQueryNode(parent);
      if (!isName) globals.add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return {
    globals: [...globals].filter((name) => !imported.has(name)),
    elements: [...elements]
  };
}

const files = sourceFiles(here);

describe("dialogs use no browser globals or HTML elements", () => {
  it("finds the dialogs", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("notices a global and an HTML element", () => {
    const source = [
      'import { Box } from "@notesnook/ui-kit";',
      "export const A = (p: { icon: () => null }) => {",
      "  window.open('x');",
      "  return <Box><b>hi</b><canvas /><p.icon /></Box>;",
      "};"
    ].join("\n");
    expect(findProblems(source, "probe.tsx")).toEqual({
      globals: ["window"],
      elements: ["canvas"]
    });
  });

  for (const file of files) {
    const relative = path.relative(here, file);
    if (relative === "desktop-bridge.ts") continue;
    it(relative, () => {
      const { globals, elements } = findProblems(
        fs.readFileSync(file, "utf8"),
        file
      );
      expect(globals, "browser globals used without an import").toEqual([]);
      expect(elements, "raw HTML elements").toEqual([]);
    });
  }
});
