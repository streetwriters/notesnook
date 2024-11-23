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

import satori from "satori";
import { ThemeDark } from "@notesnook/theme";
import sharp from "sharp";
import fontRegular from "../assets/fonts/open-sans-v34-vietnamese_latin-ext_latin_hebrew_greek-ext_greek_cyrillic-ext_cyrillic-regular.ttf?arraybuffer";
import fontBold from "../assets/fonts/open-sans-v34-vietnamese_latin-ext_latin_hebrew_greek-ext_greek_cyrillic-ext_cyrillic-600.ttf?arraybuffer";
import {} from "lru-cache";
import { Readable } from "node:stream";
import { LRUCache } from "lru-cache";

export type OGMetadata = { title: string; description: string; date: string };

const cache = new LRUCache<string, string>({
  ttl: 1000 * 60 * 60 * 24,
  ttlAutopurge: true
});

export async function makeImage(metadata: OGMetadata, cacheKey: string) {
  const theme = ThemeDark.scopes.base;

  console.time("satori");
  let svg = cache.get(cacheKey);

  if (!svg) {
    svg = await satori(
      <div
        style={{
          flexDirection: "column",
          display: "flex",
          justifyContent: "space-between",
          height: "100%",
          borderBottom: "10px solid #008837",
          backgroundColor: theme.primary.background,
          width: "100%",
          padding: 50,
          margin: 0
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p
            style={{
              fontSize: 25,
              margin: 0,
              color: theme.secondary.paragraph
            }}
          >
            {metadata.date}
          </p>
          <h1
            style={{
              margin: 0,
              marginTop: 5,
              fontSize: 64,
              fontWeight: 600,
              color: theme.primary.heading
            }}
          >
            {metadata.title}
          </h1>
          <p
            style={{
              margin: 0,
              marginTop: 5,
              fontSize: 30,
              color: theme.primary.paragraph
            }}
          >
            {Buffer.from(metadata.description || "", "base64").toString(
              "utf-8"
            )}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "row", flexShrink: 0 }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 1024 1024"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_25_12)">
              <path d="M1024 0H0V1024H1024V0Z" fill="white" />
              <path
                d="M736.652 699.667C719.397 750.078 684.817 792.732 639.064 820.039C593.311 847.346 539.354 857.535 486.794 848.792C434.234 840.049 386.481 812.942 352.032 772.294C317.583 731.646 298.673 680.095 298.667 626.812V516.562L377.788 549.615V626.767C377.78 647.546 382.221 668.085 390.812 687.005C399.402 705.924 411.943 722.785 427.592 736.455C430.562 739.042 433.644 741.562 436.828 743.914C460.184 761.302 488.23 771.266 517.322 772.511C518.312 772.511 519.268 772.59 520.247 772.612C521.225 772.635 522.497 772.612 523.622 772.612C524.747 772.612 525.872 772.612 526.997 772.612C528.122 772.612 528.932 772.612 529.922 772.511C559.002 771.263 587.038 761.308 610.393 743.936C613.565 741.585 616.648 739.076 619.629 736.489C640.186 718.51 655.286 695.123 663.212 668.989L736.652 699.667Z"
                fill="black"
              />
              <path
                d="M748.667 430.748V626.813C748.667 629.344 748.667 631.887 748.509 634.418L669.545 601.399V430.748C669.533 393.064 654.939 356.847 628.82 329.682C602.702 302.518 567.086 286.514 529.431 285.022C491.777 283.53 455.006 296.666 426.82 321.679C398.634 346.692 381.221 381.641 378.227 419.206C377.945 423.008 377.788 426.867 377.788 430.748V479.461L298.667 446.386V205.748H523.667C583.34 205.748 640.57 229.453 682.766 271.649C724.961 313.845 748.667 371.074 748.667 430.748Z"
                fill="black"
              />
            </g>
            <defs>
              <clipPath id="clip0_25_12">
                <rect width="1024" height="1024" rx="200" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <div
            style={{ display: "flex", flexDirection: "column", marginLeft: 15 }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 600,
                color: theme.primary.heading
              }}
            >
              Notesnook Monograph
            </p>
            <p
              style={{
                fontSize: 25,
                margin: 0,
                color: theme.secondary.paragraph
              }}
            >
              Anonymous, secure, and encrypted note sharing with password
              protection.
            </p>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Open Sans",
            data: fontRegular!,
            weight: 400,
            style: "normal"
          },
          {
            name: "Open Sans",
            data: fontBold!,
            weight: 600,
            style: "normal"
          }
        ]
      }
    );
    cache.set(cacheKey, svg);
  }
  console.timeEnd("satori");

  return sharp(Buffer.from(svg)).png().toBuffer();
}
