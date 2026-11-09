import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickId,
  count,
  expectClosed,
  settle,
  texts,
  start,
  typeInto
} from "./dialogs";

function buildPdf(pages: string[]) {
  const objects: string[] = [];
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
  objects.push("<</Type/Catalog/Pages 2 0 R>>");
  objects.push(`<</Type/Pages/Kids[${kids}]/Count ${pages.length}>>`);
  objects.push("<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>");
  pages.forEach((text, i) => {
    const content = `BT /F1 24 Tf 40 150 Td (${text}) Tj ET`;
    objects.push(
      `<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]/Resources<</Font<</F1 3 0 R>>>>/Contents ${
        5 + i * 2
      } 0 R>>`
    );
    objects.push(`<</Length ${content.length}>>stream\n${content}\nendstream`);
  });
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets)
    out += `${String(offset).padStart(10, "0")} 00000 n \n`;
  out += `trailer<</Size ${
    objects.length + 1
  }/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1").toString("base64");
}

const PAD = Buffer.from(
  "28BF4E5E4E758A4164004E56FFFA01082E2E00B6D0683E802F0CA9FE6453697A",
  "hex"
);

function rc4(key: Buffer, data: Buffer) {
  const state = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + state[i] + key[i % key.length]) & 255;
    [state[i], state[j]] = [state[j], state[i]];
  }
  const out = Buffer.alloc(data.length);
  let a = 0;
  let b = 0;
  for (let k = 0; k < data.length; k++) {
    a = (a + 1) & 255;
    b = (b + state[a]) & 255;
    [state[a], state[b]] = [state[b], state[a]];
    out[k] = data[k] ^ state[(state[a] + state[b]) & 255];
  }
  return out;
}

const md5 = (data: Buffer) => createHash("md5").update(data).digest();

function buildEncryptedPdf(password: string, text: string) {
  const padded = Buffer.concat([Buffer.from(password, "latin1"), PAD]).subarray(
    0,
    32
  );
  const owner = rc4(md5(padded).subarray(0, 5), padded);
  const permissions = Buffer.alloc(4);
  permissions.writeInt32LE(-4);
  const id = Buffer.from("00112233445566778899aabbccddeeff", "hex");
  const key = md5(Buffer.concat([padded, owner, permissions, id])).subarray(
    0,
    5
  );
  const user = rc4(key, PAD);
  const objectKey = (number: number) =>
    md5(Buffer.concat([key, Buffer.from([number, 0, 0, 0, 0])])).subarray(
      0,
      10
    );
  const content = rc4(
    objectKey(5),
    Buffer.from(`BT /F1 24 Tf 40 150 Td (${text}) Tj ET`, "latin1")
  );
  const hex = (b: Buffer) => `<${b.toString("hex")}>`;
  const parts: Buffer[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (b: Buffer | string) => {
    const buf = typeof b === "string" ? Buffer.from(b, "latin1") : b;
    parts.push(buf);
    length += buf.length;
  };
  push("%PDF-1.4\n");
  const objects: (Buffer | string)[] = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[4 0 R]/Count 1>>",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]/Resources<</Font<</F1 3 0 R>>>>/Contents 5 0 R>>",
    Buffer.concat([
      Buffer.from(`<</Length ${content.length}>>stream\n`, "latin1"),
      content,
      Buffer.from("\nendstream", "latin1")
    ]),
    `<</Filter/Standard/V 1/R 2/O ${hex(owner)}/U ${hex(user)}/P -4>>`
  ];
  objects.forEach((body, i) => {
    offsets.push(length);
    push(`${i + 1} 0 obj\n`);
    push(body);
    push("\nendobj\n");
  });
  const xref = length;
  push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets)
    push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  push(
    `trailer<</Size ${objects.length + 1}/Root 1 0 R/Encrypt 6 0 R/ID[${hex(
      id
    )}${hex(id)}]>>\nstartxref\n${xref}\n%%EOF\n`
  );
  return Buffer.concat(parts).toString("base64");
}

let app: DesktopApp;

beforeAll(async () => {
  app = await start({
    openPdf: { base64: buildPdf(["Hello first page", "Second page here"]) }
  });
});

afterAll(async () => {
  await app.close();
});

describe("pdf preview dialog", () => {
  test("opens the document with its page count", async () => {
    await settle(async () => expect(await count(app, "pdf-preview")).toBe(1));
    await settle(async () =>
      expect(await app.getByText("/ 2", { exact: false }).count()).toBe(1)
    );
  });

  test("zoom in and out change the shown percentage", async () => {
    const zoom = async () =>
      (await app.query("testID", "pdf-zoom", true))[0]?.text;
    const before = await zoom();
    await clickId(app, "Zoom in");
    await settle(async () => expect(await zoom()).not.toBe(before));
    await clickId(app, "Zoom out");
    await settle(async () => expect(await zoom()).toBe(before));
  });

  test("next page updates the page input", async () => {
    await clickId(app, "Go to next page");
    await settle(async () => {
      const [input] = await app.query("testID", "pdf-page-input", true);
      expect(input.text).toBe("2");
    });
  });

  test("search finds a hit", async () => {
    await clickId(app, "Search");
    await typeInto(app, "pdf-search-input", "Second");
    await app.press("enter");
    await settle(async () =>
      expect(await app.getByText("1 / 1", { exact: true }).count()).toBe(1)
    );
  });

  test("close dismisses the dialog", async () => {
    await clickId(app, "Close");
    await expectClosed(app, "pdf-preview");
  });
});

describe("encrypted pdf", () => {
  test("asks for the password, rejects a wrong one, then opens", async () => {
    const locked = await start({
      openPdf: { base64: buildEncryptedPdf("secret", "Hidden text") }
    });
    try {
      await new Promise((r) => setTimeout(r, 4000));
      await settle(async () =>
        expect(await count(locked, "document-password")).toBe(1)
      );
      await typeInto(locked, "document-password", "wrong");
      await locked.press("enter");
      await settle(async () =>
        expect(
          await locked.getByText("Password incorrect", { exact: false }).count()
        ).toBeGreaterThan(0)
      );
      await clickId(locked, "document-password");
      for (let i = 0; i < 5; i++) await locked.press("backspace");
      await typeInto(locked, "document-password", "secret");
      await locked.press("enter");
      await settle(async () =>
        expect(await locked.getByText("/ 1", { exact: false }).count()).toBe(1)
      );
      expect(await count(locked, "document-password")).toBe(0);
    } finally {
      await locked.close();
    }
  });
});

describe("copy selection", () => {
  test("mod-c puts the selected page text on the clipboard", async () => {
    const copying = await start({
      openPdf: { base64: buildPdf(["Hello first page"]) }
    });
    try {
      await settle(async () =>
        expect(await copying.getByText("/ 1", { exact: false }).count()).toBe(1)
      );
      await settle(async () =>
        expect((await copying.query("testID", "pdf-page-1", true)).length).toBe(
          1
        )
      );
      const [page] = await copying.query("testID", "pdf-page-1", true);
      const top = (await copying.menuBarState()).inset;
      const y = page.frame.y + top + page.frame.height * 0.45;
      const left = page.frame.x + page.frame.width * 0.145;
      const right = page.frame.x + page.frame.width * 0.75;
      await copying.mouseMove({ x: left, y });
      await copying.mouseDown({ x: left, y });
      for (let step = 1; step <= 10; step++) {
        await copying.mouseMove(
          { x: left + ((right - left) * step) / 10, y },
          { button: "left" }
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await copying.mouseUp({ x: right, y });
      await copying.press("mod-c");
      await settle(async () =>
        expect((await copying.clipboardText()) ?? "").toContain(
          "Hello first page"
        )
      );
    } finally {
      await copying.close();
    }
  });
});
