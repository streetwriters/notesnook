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

import { createWriteStream, existsSync, writeFileSync } from "fs";
import { constructURL } from "google-fonts-helper";
import { Writable } from "stream";
import { mkdir } from "fs/promises";

const FONTS = [
  { locale: "ja-JP", slug: "Noto+Sans+JP", name: "Noto Sans JP" },
  { locale: "ko-KR", slug: "Noto+Sans+KR", name: "Noto Sans KR" },
  { locale: "zh-CN", slug: "Noto+Sans+SC", name: "Noto Sans SC" },
  { locale: "zh-TW", slug: "Noto+Sans+TC", name: "Noto Sans TC" },
  { locale: "zh-HK", slug: "Noto+Sans+HK", name: "Noto Sans HK" },
  { locale: "th-TH", slug: "Noto+Sans+Thai", name: "Noto Sans Thai" },
  { locale: "bn-IN", slug: "Noto+Sans+Bengali", name: "Noto Sans Bengali" },
  { locale: "ar-AR", slug: "Noto+Sans+Arabic", name: "Noto Sans Arabic" },
  { locale: "ta-IN", slug: "Noto+Sans+Tamil", name: "Noto Sans Tamil" },
  { locale: "ml-IN", slug: "Noto+Sans+Malayalam", name: "Noto Sans Malayalam" },
  { locale: "he-IL", slug: "Noto+Sans+Hebrew", name: "Noto Sans Hebrew" },
  { locale: "te-IN", slug: "Noto+Sans+Telugu", name: "Noto Sans Telugu" },
  {
    locale: "devanagari",
    slug: "Noto+Sans+Devanagari",
    name: "Noto Sans Devanagari"
  },
  { locale: "kannada", slug: "Noto+Sans+Kannada", name: "Noto Sans Kannada" }
  //   { locale: "symbol", slug: "Noto+Sans+Symbols", name: "Noto Sans Symbols" },
  //   {
  //     locale: "symbol",
  //     slug: "Noto+Sans+Symbols+2",
  //     name: "Noto Sans Symbols 2"
  //   },
  //   { locale: "math", slug: "Noto+Sans+Math", name: "Noto Sans Math" }
];

async function loadFonts(dir) {
  const families = {};
  for (const font of FONTS) {
    families[font.name] = [400, 600];
  }

  const css = await (
    await fetch(constructURL({ families }), {
      headers: {
        // Make sure it returns TTF.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
      }
    })
  ).text();

  const fontFaces = css
    .split("@font-face")
    .filter(Boolean)
    .map((fontFace) => {
      const src = fontFace.match(
        /src: url\((.+)\) format\('(opentype|truetype)'\)/
      );
      const family = fontFace.match(/font-family: '(.+)'/);
      const weight = fontFace.match(/font-weight: (\d+)/);
      const style = fontFace.match(/font-style: (\w+)/);
      return {
        src: src[1],
        family: family[1],
        weight: weight[1],
        style: style[1]
      };
    });

  await mkdir("fonts", { recursive: true });

  const fontMap = [];
  for (const face of fontFaces) {
    console.log("Downloading", face.family, face.weight);
    const font = FONTS.find((font) => font.name === face.family);
    if (!font) continue;

    const fileName = `${font.slug}+${face.weight}.ttf`;
    const path = `fonts/${fileName}`;
    if (existsSync(path)) continue;

    const fileStream = Writable.toWeb(
      createWriteStream(path, {
        autoClose: true,
        emitClose: true,
        flush: true
      })
    );
    await (await fetch(face.src)).body.pipeTo(fileStream);

    fontMap.push({
      name: font.name,
      locale: font.locale,
      weight: face.weight,
      path
    });
  }

  writeFileSync("fonts/fonts.json", JSON.stringify(fontMap, null, 2));

  console.log("Done");
}

loadFonts();
