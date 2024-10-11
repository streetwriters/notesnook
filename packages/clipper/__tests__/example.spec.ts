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

    await page.waitForLoadState("networkidle");

    // const originalScreenshot = await page.screenshot({
    //   fullPage: true,
    //   type: "jpeg"
    // });

    // expect(originalScreenshot).toMatchSnapshot({
    //   name: `${slugify(website.title)}.jpg`,
    //   maxDiffPixelRatio: 0.1
    // });

    const result = await page.evaluate(async () => {
      const html = await window.clipper.clipPage(window.document, true, false);
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

    rmSync(tempFilePath, { force: true });
  });
}

for (const website of Websites) {
  const domain = new URL(website.url).hostname;
  test(`clip as image ${domain} (${website.title})`, async ({ page }, info) => {
    info.setTimeout(0);

    await page.goto(website.url);

    await page.addScriptTag({ content: output, type: "text/javascript" });

    await page.waitForLoadState("networkidle");

    // const originalScreenshot = await page.screenshot({
    //   fullPage: true,
    //   type: "jpeg"
    // });

    // expect(originalScreenshot).toMatchSnapshot({
    //   name: `${slugify(website.title)}.jpg`,
    //   maxDiffPixelRatio: 0.1
    // });

    const result = await page.evaluate(async () => {
      const data = await window.clipper.clipScreenshot(undefined, "raw");
      if (data) {
        return base64ArrayBuffer(await data.arrayBuffer());
      }

      function base64ArrayBuffer(arrayBuffer) {
        let base64 = "";
        const encodings =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

        const bytes = new Uint8Array(arrayBuffer);
        const byteLength = bytes.byteLength;
        const byteRemainder = byteLength % 3;
        const mainLength = byteLength - byteRemainder;

        let a, b, c, d;
        let chunk;

        // Main loop deals with bytes in chunks of 3
        for (let i = 0; i < mainLength; i = i + 3) {
          // Combine the three bytes into a single integer
          chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

          // Use bitmasks to extract 6-bit segments from the triplet
          a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
          b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
          c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
          d = chunk & 63; // 63       = 2^6 - 1

          // Convert the raw binary segments to the appropriate ASCII encoding
          base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder == 1) {
          chunk = bytes[mainLength];

          a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

          // Set the 4 least significant bits to zero
          b = (chunk & 3) << 4; // 3   = 2^2 - 1

          base64 += encodings[a] + encodings[b] + "==";
        } else if (byteRemainder == 2) {
          chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

          a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
          b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

          // Set the 2 least significant bits to zero
          c = (chunk & 15) << 2; // 15    = 2^4 - 1

          base64 += encodings[a] + encodings[b] + encodings[c] + "=";
        }

        return base64;
      }
      return null;
    });

    if (!result) throw new Error("Failed to clip page.");

    expect(Buffer.from(result, "base64")).toMatchSnapshot({
      name: `${slugify(website.title)}-image.png`,
      maxDiffPixelRatio: 0.1
    });
  });
}
