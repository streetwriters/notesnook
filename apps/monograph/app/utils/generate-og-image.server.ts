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

import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { LRUCache } from "lru-cache";
import { ThemeDark } from "@notesnook/theme";
import path from "path";
import { fileURLToPath } from "url";
import { split } from "canvas-hypertxt";
import { readFile } from "fs/promises";

export type OGMetadata = { title: string; description: string; date: string };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "../../");

const fontMap = JSON.parse(
  await readFile(path.join(ROOT, "fonts", "fonts.json"), "utf-8")
);

// Register fonts
const OpenSans = path.join(
  __dirname,
  import.meta.env.DEV ? "../assets/fonts/" : "../../assets/fonts/",
  "open-sans-v34-vietnamese_latin-ext_latin_hebrew_greek-ext_greek_cyrillic-ext_cyrillic-regular.ttf"
);
const OpenSansBold = path.join(
  __dirname,
  import.meta.env.DEV ? "../assets/fonts/" : "../../assets/fonts/",
  "open-sans-v34-vietnamese_latin-ext_latin_hebrew_greek-ext_greek_cyrillic-ext_cyrillic-600.ttf"
);

console.log("OpenSans", GlobalFonts.registerFromPath(OpenSans, "OpenSans"));
console.log(
  "registering",
  "OpenSansBold",
  GlobalFonts.registerFromPath(OpenSansBold, "OpenSansBold")
);

const fontFamilies = {
  regular: ["OpenSans"],
  bold: ["OpenSansBold"]
};
for (const font of fontMap) {
  const id = (font.name + font.weight).replace(/ /g, "");
  const result = GlobalFonts.registerFromPath(
    path.resolve(ROOT, font.path),
    id
  );
  if (!result)
    throw new Error(
      `Failed to register font: ${id} at ${path.resolve(ROOT, font.path)}`
    );
  if (font.weight === "600") fontFamilies.bold.push(id);
  else fontFamilies.regular.push(id);
  console.log("registering", id, result);
}

const cache = new LRUCache<string, Buffer>({
  ttl: 1000 * 60 * 60 * 24,
  ttlAutopurge: true
});

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 50;
const QUALITY = 80;
const logo = loadImage(
  import.meta.env.DEV
    ? path.resolve(__dirname, "../../public/logo.svg")
    : path.resolve(__dirname, "../../client/logo.svg")
);

const boldFontFamily = fontFamilies.bold.join(",");
const regularFontFamily = fontFamilies.regular.join(",");

export async function makeImage(metadata: OGMetadata, cacheKey: string) {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  console.time("canvas");
  const theme = ThemeDark.scopes.base;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = theme.primary.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Bottom border
  ctx.fillStyle = "#008837";
  ctx.fillRect(0, HEIGHT - 10, WIDTH, 10);

  // Draw logo
  ctx.drawImage(await logo, PADDING, HEIGHT - PADDING - 85, 80, 80);

  // Draw bottom text
  ctx.fillStyle = theme.primary.heading;
  ctx.font = "600 32px OpenSansBold";
  ctx.fillText("Notesnook Monograph", PADDING + 95, HEIGHT - PADDING - 55);

  ctx.fillStyle = theme.secondary.paragraph;
  ctx.font = "25px OpenSans";
  ctx.fillText(
    "Anonymous, secure, and encrypted note sharing with password protection.",
    PADDING + 95,
    HEIGHT - PADDING - 19
  );

  // Draw date
  ctx.fillStyle = theme.secondary.paragraph;
  ctx.font = "25px OpenSans";
  ctx.fillText(metadata.date, PADDING, PADDING + 25);

  // Draw title
  ctx.fillStyle = theme.primary.heading;
  ctx.font = `600 64px ${boldFontFamily}`;
  let y = PADDING + 105;
  const titleLines = split(
    ctx as any,
    metadata.title,
    `600 64px ${boldFontFamily}`,
    WIDTH - PADDING * 2,
    true
  );
  for (const line of titleLines) {
    ctx.fillText(line, PADDING, y);
    y += 60;
  }

  // Draw description
  ctx.fillStyle = theme.primary.paragraph;
  ctx.font = `30px ${regularFontFamily}`;
  const description = Buffer.from(
    metadata.description || "",
    "base64"
  ).toString("utf-8");
  const descLines = split(
    ctx as any,
    description,
    `30px ${regularFontFamily}`,
    WIDTH - PADDING * 2,
    true
  ).slice(0, 4);
  for (const line of descLines) {
    ctx.fillText(line, PADDING, y);
    y += 40;
  }

  const buffer = canvas.toBuffer("image/jpeg", QUALITY);
  console.timeEnd("canvas");

  cache.set(cacheKey, buffer);
  return buffer;
}
