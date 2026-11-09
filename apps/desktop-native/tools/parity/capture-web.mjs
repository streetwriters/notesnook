import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { extras, fixturePdfBase64, scenarios } from "./scenarios.mjs";

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

const [width, height] = scenario.size;
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [`--force-device-scale-factor=${scenario.scale}`]
});
const context = await browser.newContext({
  viewport: null,
  colorScheme: scheme
});
const page = await context.newPage();
if (process.env.PARITY_WEB_DEBUG) {
  page.on("console", (m) => console.log("web:", m.type(), m.text().slice(0, 300)));
  page.on("response", (r) => r.status() >= 400 && console.log("web http", r.status(), r.url().slice(0, 200)));
  page.on("pageerror", (e) => console.log("web pageerror:", String(e).slice(0, 400)));
}
const cdp = await context.newCDPSession(page);
const { windowId } = await cdp.send("Browser.getWindowForTarget");
let outerWidth = width;
let outerHeight = height + 120;
async function fitViewport() {
  for (let attempt = 0; attempt < 8; attempt++) {
    await cdp.send("Browser.setWindowBounds", {
      windowId,
      bounds: { windowState: "normal", width: outerWidth, height: outerHeight }
    });
    await page.waitForTimeout(300);
    const inner = await page.evaluate(() => ({
      w: window.innerWidth,
      h: window.innerHeight,
      dpr: window.devicePixelRatio
    }));
    if (inner.dpr !== scenario.scale)
      throw new Error(
        `devicePixelRatio is ${inner.dpr}, expected ${scenario.scale}`
      );
    if (inner.w === width && inner.h === height) return;
    outerWidth += width - inner.w;
    outerHeight += height - inner.h;
  }
  throw new Error("could not size the viewport to " + width + "x" + height);
}
await fitViewport();
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
  async ({ seed, scheme, extras, noExtras, reminders, proUser }) => {
    const { db } = await import("/common/db.ts");
    const addNotebook = async (notebook, parentId) => {
      const id = await db.notebooks.add({ title: notebook.title });
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (parentId)
        await db.relations.add(
          { type: "notebook", id: parentId },
          { type: "notebook", id }
        );
      for (const child of notebook.children ?? []) await addNotebook(child, id);
    };
    for (const notebook of extras.notebooks) await addNotebook(notebook);
    if (!noExtras)
      for (const tag of extras.tags) await db.tags.add({ title: tag.title });
    if (!noExtras)
      for (const color of extras.colors)
        await db.colors.add({ title: color.title, colorCode: color.colorCode });
    for (const note of seed) {
      const id = await db.notes.add({
        title: note.title,
        content: { type: "tiptap", data: `<p>${note.content}</p>` },
        favorite: note.favorite,
        dateCreated: note.dateCreated,
        dateEdited: note.dateEdited
      });
      if (!id) continue;
      if (note.pinned) await db.notes.pin(true, id);
      if (note.archived) await db.notes.archive(true, id);
      for (const title of note.tags ?? []) {
        const tagId =
          (await db.tags.find(title))?.id ?? (await db.tags.add({ title }));
        if (tagId)
          await db.relations.add(
            { type: "tag", id: tagId },
            { type: "note", id }
          );
      }
      if (note.color) {
        const colorId = await db.colors.add({
          title: note.color,
          colorCode: note.color
        });
        if (colorId)
          await db.relations.add(
            { type: "color", id: colorId },
            { type: "note", id }
          );
      }
      if (note.trashed) await db.notes.moveToTrash(id);
    }
    for (const reminder of reminders)
      await db.reminders.add({
        title: reminder.title,
        description: reminder.description,
        date: reminder.date ?? Date.now() + 24 * 60 * 60 * 1000,
        mode: reminder.mode ?? "once",
        recurringMode: reminder.recurringMode,
        selectedDays: reminder.selectedDays ?? [],
        priority: reminder.priority ?? "vibrate",
        disabled: reminder.disabled ?? false
      });
    if (proUser) {
      const now = Date.now();
      await db.user.setUser({
        id: "e2e-user",
        email: "e2e@example.com",
        isEmailConfirmed: true,
        mfa: {
          isEnabled: false,
          primaryMethod: "email",
          remainingValidCodes: 0
        },
        subscription: {
          appId: 0,
          cancelURL: null,
          expiry: now + 365 * 24 * 60 * 60 * 1000,
          productId: null,
          provider: 0,
          start: now,
          plan: 2,
          status: 0,
          updateURL: null,
          googlePurchaseToken: null
        }
      });
    }
    const { store } = await import("/stores/note-store.ts");
    await store.refresh();
    const appStore = await import("/stores/app-store.ts");
    await appStore.store.refreshNavItems();
    const theme = await import("/stores/theme-store.ts");
    theme.store.setColorScheme(scheme);
  },
  {
    seed,
    scheme,
    extras: { ...extras, notebooks: scenario.notebooks ?? extras.notebooks },
    noExtras: !!scenario.noExtras,
    proUser: !!scenario.proUser,
    reminders: (scenario.reminders ?? []).map((reminder) =>
      typeof reminder === "function" ? reminder(Date.now()) : reminder
    )
  }
);
await page.waitForTimeout(3000);
await page.mouse.move(2, 2);
await page.waitForTimeout(500);

await page.addStyleTag({
  content:
    "*, *::before, *::after { caret-color: transparent !important; animation: none !important; transition: none !important; }"
});
await page.evaluate(() => document.fonts.ready);

const target = (spec) =>
  spec === "route-action"
    ? page.locator('[data-test-id="routeHeader"] button').first()
    : typeof spec === "string"
    ? page.locator(`[data-test-id="${spec}"]`).first()
    : page.locator(`[data-test-id="${spec.id}"]`).nth(spec.nth ?? 0);
if (scenario.openPdf) {
  await page.evaluate(async (base64) => {
    const { PdfPreviewDialog } = await import("/dialogs/pdf-preview-dialog.tsx");
    PdfPreviewDialog.show({
      url: `data:application/pdf;base64,${base64}`,
      hash: "parity-pdf"
    });
  }, fixturePdfBase64());
  await page.waitForTimeout(4000);
}
if (process.env.PARITY_WEB_DEBUG)
  await page.screenshot({ path: process.env.PARITY_WEB_DEBUG });
for (const step of scenario.steps ?? []) {
  if (step.click === "sidebar-toggle") await page.mouse.click(20, 22);
  else if (step.click) await target(step.click).click();
  if (step.expand !== undefined)
    await page.locator("#notebooks button").nth(step.expand).click();
  if (step.type) {
    await target(step.type.id).click();
    await page.keyboard.type(step.type.text);
    await page.waitForTimeout(2500);
  }
  if (step.wheel) await page.mouse.move(step.wheel.x, step.wheel.y).then(() => page.mouse.wheel(0, step.wheel.dy));
  if (step.probe)
    console.log(
      "PROBE",
      step.probe,
      JSON.stringify(
        await page.evaluate(() => {
          const out = [];
          for (const el of document.querySelectorAll("*"))
            if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight + 50)
              out.push({ tag: el.tagName, id: el.getAttribute("data-test-id") || el.id || el.className.toString().slice(0, 30), top: Math.round(el.scrollTop) });
          return out;
        })
      )
    );
  if (step.rightClick) await target(step.rightClick).click({ button: "right" });
  if (step.press)
    await page.keyboard.press(
      { escape: "Escape", enter: "Enter", backspace: "Backspace" }[step.press] ?? step.press
    );
  if (step.clickText)
    await page
      .locator(
        step.in === "nav"
          ? '[data-test-id="navigation-menu"]'
          : '[data-test-id="settings-navigation-menu"]'
      )
      .getByText(step.clickText, { exact: true })
      .first()
      .click();
  if (step.hover) await target(step.hover).hover();
  await page.waitForTimeout(800);
}
if (!scenario.keepPointer) await page.mouse.move(2, 2);
await page.waitForTimeout(300);

await fitViewport();
await page.waitForTimeout(500);
if (process.env.PARITY_DUMP)
  console.log(
    await page.evaluate(() => {
      const describe = (el) =>
        `${el.tagName}.${el.className?.toString().slice(0, 30)}:${(
          el.textContent || ""
        ).slice(0, 16)}`;
      return JSON.stringify({
        active: describe(document.activeElement),
        hover: [...document.querySelectorAll(":hover")].map(describe).slice(-3),
        focusWithin: [...document.querySelectorAll(":focus-within")]
          .map(describe)
          .slice(-3),
        focusVisible: [...document.querySelectorAll(":focus-visible")].map(
          describe
        ),
        rules: (() => {
          const rows = [
            ...document.querySelectorAll('[data-test-id="list-item"]')
          ].filter((el) => /^(Plans|Reports)/.test(el.textContent || ""));
          const out = [];
          for (const row of rows) {
            out.push(`${row.textContent.slice(0, 6)} class=${row.className}`);
            const cls = [...row.classList];
            for (const sheet of document.styleSheets) {
              let list = [];
              try {
                list = [...sheet.cssRules];
              } catch {}
              for (const rule of list)
                if (rule.cssText && cls.some((c) => rule.cssText.includes(c)))
                  out.push(rule.cssText.slice(0, 400));
            }
          }
          return out;
        })(),
        rows: [...document.querySelectorAll('[data-test-id="list-item"]')]
          .slice(0, 6)
          .map((el) => ({
            t: (el.textContent || "").slice(0, 10),
            bg: getComputedStyle(el).backgroundColor,
            focus: el.matches(":focus"),
            hover: el.matches(":hover"),
            fw: el.matches(":focus-within"),
            fv: el.matches(":focus-visible")
          }))
      });
    })
  );
const elements = await page.evaluate(() => {
  const rgba = (value) => {
    const m = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
    return [m[0], m[1], m[2], m[3] === undefined ? 1 : m[3]];
  };
  const out = [];
  for (const el of document.querySelectorAll("[data-test-id]")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
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
      letterSpacing:
        cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
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

const textNodes = await page.evaluate(() => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const describe = (el) => {
    const cs = getComputedStyle(el);
    const id = el.getAttribute("data-test-id");
    return `${el.tagName.toLowerCase()}${id ? `[${id}]` : ""}@${cs.fontSize}`;
  };
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent.trim();
    if (!text) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const r = range.getClientRects()[0];
    if (!r || r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(parent);
    const chain = [];
    for (let el = parent; el && chain.length < 8; el = el.parentElement)
      chain.push(describe(el));
    out.push({
      text: text.slice(0, 40),
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      fontFamily: cs.fontFamily.split(",")[0].replaceAll('"', "").trim(),
      fontSize: parseFloat(cs.fontSize),
      fontWeight: Number(cs.fontWeight),
      lineHeight: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
      chain
    });
  }
  return out;
});

const inputs = await page.evaluate(() =>
  [...document.querySelectorAll("input, textarea")]
    .map((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      const cs = getComputedStyle(el);
      const ph = getComputedStyle(el, "::placeholder");
      const shown = el.value ? cs : ph;
      return {
        text: el.value || el.placeholder || "",
        isPlaceholder: !el.value,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        fontFamily: shown.fontFamily.split(",")[0].replaceAll('"', "").trim(),
        fontSize: parseFloat(shown.fontSize),
        fontWeight: Number(shown.fontWeight),
        id: el.getAttribute("data-test-id")
      };
    })
    .filter(Boolean)
);

await fitViewport();
if (process.env.PARITY_WEB_DUMP)
  console.log(
    JSON.stringify(
      await page.evaluate((testId) => {
        const target = document.querySelector(`[data-test-id="${testId}"]`);
        const out = [];
        let node = target;
        for (let depth = 0; node && depth < 4; depth++) {
          const parent = node.parentElement;
          if (!parent) break;
          for (const child of parent.children) {
            const r = child.getBoundingClientRect();
            const cs = getComputedStyle(child);
            out.push({
              depth,
              tag: child.tagName,
              id: child.getAttribute("data-test-id") || child.id || "",
              x: r.x, y: r.y, w: r.width, h: r.height,
              mt: cs.marginTop, mb: cs.marginBottom, pt: cs.paddingTop, pb: cs.paddingBottom,
              box: cs.boxSizing, lh: cs.lineHeight, fs: cs.fontSize
            });
          }
          node = parent;
        }
        return out;
      }, process.env.PARITY_WEB_DUMP),
      null,
      1
    )
  );
let shot = await page.screenshot();
for (let attempt = 0; attempt < 6; attempt++) {
  await page.waitForTimeout(700);
  const next = await page.screenshot();
  if (next.equals(shot)) break;
  shot = next;
}
fs.writeFileSync(path.join(outDir, "web.png"), shot);
fs.writeFileSync(
  path.join(outDir, "web-map.json"),
  JSON.stringify({ elements, textRects, textNodes, inputs }, null, 1)
);
await browser.close();
