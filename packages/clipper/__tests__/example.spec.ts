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

import { expect, test } from "@playwright/test";
import { buildSync } from "esbuild";
import path, { join } from "path";
import type { Clipper } from "../src/index.js";
import Websites from "./pages.json";
import slugify from "slugify";
import { mkdirSync, rmSync, writeFileSync } from "fs";

declare global {
  interface Window {
    clipper: Clipper;
  }
}

test.setTimeout(0);
test.use({ bypassCSP: true });

const tempDirPath = join(__dirname, "temp");
const output = buildSync({
  bundle: true,
  entryPoints: [path.join(__dirname, "../src/index.ts")],
  minify: false,
  write: false,
  globalName: "clipper"
}).outputFiles[0].text;

test.beforeAll(() => {
  mkdirSync(tempDirPath, { recursive: true });
});

// test.afterAll(() => {
//   rmSync(tempDirPath, { recursive: true, force: true });
// });

for (const website of Websites) {
  const domain = new URL(website.url).hostname;
  test(`clip ${domain} (${website.title})`, async ({ page }, info) => {
    info.setTimeout(0);

    await page.goto(website.url);

    await page.addScriptTag({ content: output, type: "text/javascript" });

    // const originalScreenshot = await page.screenshot({
    //   fullPage: true,
    //   type: "jpeg"
    // });

    // expect(originalScreenshot).toMatchSnapshot({
    //   name: `${slugify(website.title)}.jpg`,
    //   maxDiffPixelRatio: 0.1
    // });

    const result = await page.evaluate(async () => {
      const html = await window.clipper.clipPage(window.document, false, {
        corsProxy: "https://cors.notesnook.com",
        images: true,
        inlineImages: true,
        styles: true
      });
      if (html) {
        return `\ufeff${html}`;
      }
      return null;
    });

    if (!result) throw new Error("Failed to clip page.");

    const tempFilePath = join(
      tempDirPath,
      `${slugify(website.title.toLowerCase())}.html`
    );

    writeFileSync(join(tempFilePath), result);

    await page.goto(`file://${tempFilePath}`);

    const clippedScreenshot = await page.screenshot({
      fullPage: true,
      type: "jpeg"
    });

    expect(clippedScreenshot).toMatchSnapshot({
      name: `${slugify(website.title)}.jpg`,
      maxDiffPixelRatio: 0.1
    });

    // rmSync(tempFilePath, { force: true });
  });
}
