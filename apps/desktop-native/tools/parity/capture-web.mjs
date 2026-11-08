import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { scenarios } from "./scenarios.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "../../../web");
const { chromium } = createRequire(path.join(webDir, "package.json"))(
  "playwright"
);

const [scenarioName, scheme, outDir, seedFile] = process.argv.slice(2);
const baseUrl = process.env.WEB_URL ?? "http://localhost:5183/";
const scenario = scenarios[scenarioName];
const seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: scenario.size[0], height: scenario.size[1] },
  deviceScaleFactor: scenario.scale,
  colorScheme: scheme
});
const page = await context.newPage();
await page.goto(baseUrl, { waitUntil: "load" });
await page.waitForTimeout(6000);
const offline = page.getByText("Use offline");
if (await offline.count()) {
  await offline.first().click();
  await page.waitForTimeout(1000);
  await page.getByText("I understand").click();
  await page.waitForTimeout(10000);
}
await page.evaluate(
  async ({ seed, scheme }) => {
    const { db } = await import("/common/db.ts");
    for (const note of seed)
      await db.notes.add({
        title: note.title,
        content: { type: "tiptap", data: `<p>${note.content}</p>` },
        favorite: note.favorite,
        dateCreated: note.dateCreated,
        dateEdited: note.dateEdited
      });
    const { store } = await import("/stores/note-store.ts");
    await store.refresh();
    const theme = await import("/stores/theme-store.ts");
    theme.store.setColorScheme(scheme);
  },
  { seed, scheme }
);
await page.waitForTimeout(3000);
await page.mouse.move(2, 2);
await page.waitForTimeout(500);

const elements = await page.evaluate(() => {
  const rgba = (value) => {
    const m = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
    return [m[0], m[1], m[2], m[3] === undefined ? 1 : m[3]];
  };
  const out = [];
  for (const el of document.querySelectorAll("[data-test-id]")) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push({
      id: el.getAttribute("data-test-id"),
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      background: rgba(cs.backgroundColor),
      color: rgba(cs.color),
      borderColor: rgba(cs.borderTopColor),
      borderWidth: parseFloat(cs.borderTopWidth),
      fontFamily: cs.fontFamily.split(",")[0].replaceAll('"', "").trim(),
      fontSize: parseFloat(cs.fontSize),
      fontWeight: Number(cs.fontWeight),
      lineHeight: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
      letterSpacing: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
      text: (el.textContent || "").trim().slice(0, 40)
    });
  }
  return out;
});

const textRects = await page.evaluate(() => {
  const rects = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects())
      if (r.width > 0 && r.height > 0)
        rects.push({ x: r.x, y: r.y, width: r.width, height: r.height });
  }
  return rects;
});

fs.writeFileSync(path.join(outDir, "web.png"), await page.screenshot());
fs.writeFileSync(
  path.join(outDir, "web-map.json"),
  JSON.stringify({ elements, textRects }, null, 1)
);
await browser.close();
