import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickId,
  count,
  expectClosed,
  settle,
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
    await clickId(app, "pdf-zoom-in");
    await settle(async () => expect(await zoom()).not.toBe(before));
    await clickId(app, "pdf-zoom-out");
    await settle(async () => expect(await zoom()).toBe(before));
  });

  test("next page updates the page input", async () => {
    await clickId(app, "pdf-next-page");
    await settle(async () => {
      const [input] = await app.query("testID", "pdf-page-input", true);
      expect(input.text).toBe("2");
    });
  });

  test("search finds a hit", async () => {
    await clickId(app, "pdf-search");
    await typeInto(app, "pdf-search-input", "Second");
    await app.press("enter");
    await settle(async () =>
      expect(await app.getByText("1 / 1", { exact: true }).count()).toBe(1)
    );
  });

  test("close dismisses the dialog", async () => {
    await clickId(app, "pdf-close");
    await expectClosed(app, "pdf-preview");
  });
});
