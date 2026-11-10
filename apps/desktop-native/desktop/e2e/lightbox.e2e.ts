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

import { deflateSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { clickId, count, settle, start } from "./dialogs";

function png() {
  const size = 64;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const at = y * (size * 3 + 1) + 1 + x * 3;
      raw[at] = x * 4;
      raw[at + 1] = y * 4;
      raw[at + 2] = 128;
    }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buffer: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buffer) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]).toString("base64");
}

let app: DesktopApp;

beforeAll(async () => {
  app = await start({
    openLightbox: { image: `data:image/png;base64,${png()}` }
  });
});

afterAll(async () => {
  await app.close();
});

const view = async () => {
  const [image] = await app.query("testID", "lightbox-image", true);
  const props = (await app.getProps(image.tag)) as {
    transform: number[];
    frame: { x: number; y: number; width: number; height: number };
  };
  return {
    frame: props.frame,
    scale: props.frame.width / 100,
    shiftX: props.transform[12]
  };
};

describe("lightbox", () => {
  test("opens and the load indicator goes away once the image is loaded", async () => {
    await settle(async () => expect(await count(app, "lightbox")).toBe(1));
    await settle(async () =>
      expect(await count(app, "lightbox-loading")).toBe(0)
    );
  });

  test("zooming in then dragging the image moves it", async () => {
    await clickId(app, "Zoom in");
    await clickId(app, "Zoom in");
    await settle(async () => expect((await view()).scale).toBeGreaterThan(1.4));
    const before = await view();
    const inset = (await app.menuBarState()).inset;
    const from = {
      x: before.frame.x + before.frame.width / 2,
      y: before.frame.y + before.frame.height / 2 + inset
    };
    const to = { x: from.x + 60, y: from.y + 30 };
    await app.mouseMove(from);
    await app.mouseDown(from);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await app.mouseMove({ x: from.x + 30, y: from.y + 15 });
    await app.mouseMove(to);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await app.mouseUp(to);
    await settle(async () =>
      expect((await view()).shiftX - before.shiftX).toBeGreaterThan(40)
    );
  });

  test("reset puts the image back", async () => {
    await clickId(app, "Reset");
    await settle(async () => {
      const state = await view();
      expect(state.scale).toBeCloseTo(1, 1);
    });
  });
});
