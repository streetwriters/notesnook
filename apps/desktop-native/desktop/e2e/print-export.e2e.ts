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
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickMenu,
  goTo,
  rightClick,
  settle,
  startViews,
  resetUi
} from "./views";

const directory = mkdtempSync(path.join(tmpdir(), "notesnook-print-"));
const RICH =
  "Intro with <strong>bold</strong> and <em>italic</em> text.</p>" +
  "<h2>Section heading</h2>" +
  "<ul><li><p>First bullet</p></li><li><p>Second bullet</p></li></ul>" +
  "<table><tbody><tr><th>Name</th><th>Value</th></tr><tr><td>alpha</td><td>1</td></tr></tbody></table>" +
  "<pre><code>let code = 1;</code></pre>" +
  '<p>Math <span class="math-inline math-node">x^2</span> done';

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews({
    seed: [{ title: "Printable note", content: RICH, dateEdited: Date.now() }],
    printOutputPath: `${directory}/printed.pdf`,
    exportDirectory: directory
  });
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await resetUi(app);
});

async function pdfText(file: string) {
  const require = createRequire(import.meta.url);
  const pdfRequire = createRequire(
    require.resolve("@react-native-gpui/pdf/package.json")
  );
  const { createLocalEngine } = await import(
    pdfRequire.resolve("@embedpdf/engine")
  );
  const engine = createLocalEngine();
  try {
    const doc = await engine.open(
      { kind: "bytes", bytes: new Uint8Array(readFileSync(file)) },
      { scope: ["*"] }
    );
    const list = await doc.pages.list();
    let text = "";
    for (const page of list.pages)
      text += (await doc.page(page.ref).text.get()).text + "\n";
    return { pages: list.pageCount as number, text };
  } finally {
    await engine.destroy();
  }
}

function expectNote(result: { pages: number; text: string }) {
  expect(result.pages).toBeGreaterThanOrEqual(1);
  expect(result.text).toContain("Printable note");
  expect(result.text).toContain("Intro with bold and italic text.");
  expect(result.text).toContain("Section heading");
  expect(result.text).toContain("First bullet");
  expect(result.text).toContain("Second bullet");
  expect(result.text).toContain("alpha");
  expect(result.text).toContain("let code = 1;");
}

describe("print and export as PDF", () => {
  test("Print compiles the note and sends it to the printer", async () => {
    await goTo(app, "Notes");
    await rightClick(app, "Printable note");
    await clickMenu(app, "print");
    await settle(async () =>
      expect(existsSync(`${directory}/printed.pdf`)).toBe(true)
    );
    expectNote(await pdfText(`${directory}/printed.pdf`));
  });

  test("Export as PDF writes the file through the export flow", async () => {
    await rightClick(app, "Printable note");
    await clickMenu(app, "export");
    await clickMenu(app, "pdf");
    const file = `${directory}/Printable-note.pdf`;
    await settle(async () => expect(existsSync(file)).toBe(true));
    expectNote(await pdfText(file));
  });
});
