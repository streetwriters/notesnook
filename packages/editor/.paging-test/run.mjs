import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// playwright-core is not a direct dependency of this package; resolve it from
// wherever it is installed in the monorepo (clipper/desktop use it).
const pwPath = join(
  __dirname,
  "../../clipper/node_modules/playwright-core/index.js"
);
const { chromium } = await import(pathToFileURL(pwPath).href).then(
  (m) => m.default ?? m
);
const url = pathToFileURL(join(__dirname, "index.html")).href;

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const results = [];
function check(name, cond, detail = "") {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on("console", (m) => console.log("  [console]", m.type(), m.text()));
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

await page.goto(url);
await page.waitForFunction("window.__ready === true", { timeout: 5000 });
// let IntersectionObserver settle
await page.waitForTimeout(400);

const t = (fn, ...args) => page.evaluate(fn, ...args);

const total = await t("window.__t.totalTop()");
const rendered = await t("window.__t.renderedCount()");
const placeholders = await t("window.__t.placeholderCount()");
const docSize = await t("window.__t.docSize()");

check("total top-level blocks = 200", total === 200, `total=${total}`);
check(
  "most blocks are placeholders (rendered << total)",
  rendered < 80 && placeholders > 100,
  `rendered=${rendered} placeholders=${placeholders}`
);
check(
  "off-screen content NOT in the DOM",
  (await t("window.__t.domHasSentinel()")) === false,
  "sentinel absent from view.dom"
);
check(
  "off-screen content IS in editor state",
  (await t("window.__t.stateHasSentinel()")) === true
);

const selSize = await t("window.__t.selectAllSize()");
check(
  "select-all spans the whole document",
  selSize === docSize,
  `selectAll=${selSize} docSize=${docSize}`
);

const before = await t("window.__t.docJSON()");

// scroll to the bottom and let it materialize
await t("window.__t.scrollToBottom()");
await page.waitForTimeout(500);
check(
  "scrolling materializes off-screen content",
  (await t("window.__t.domHasSentinel()")) === true,
  "sentinel now in DOM"
);
check(
  "block 180 (sentinel) is a real node after scroll",
  (await t("window.__t.blockRenderedAt(180)")) === true
);

const after = await t("window.__t.docJSON()");
check(
  "document state unchanged by scroll/virtualization",
  before === after,
  before === after ? "identical" : "DIVERGED"
);

// caret into an off-screen block should force it to render
await t("window.__t.scrollToTop()");
await page.waitForTimeout(300);
await t("window.__t.caretToOffscreen()");
await page.waitForTimeout(200);
check(
  "block containing the caret is always rendered",
  (await t("window.__t.blockRenderedAt(120)")) === true
);

// editing an off-screen block applies to state
const edited = await t("window.__t.editOffscreen()");
check(
  "editing an off-screen block applies to state",
  typeof edited === "string" && edited.includes("X"),
  `text@150="${edited}"`
);

// stress: random on/off-screen edits + viewport moves
let pageErrors = 0;
page.on("pageerror", () => pageErrors++);
const stress = await t("window.__t.stress(400)");
await page.waitForTimeout(200);
check(
  "400 random edits: no exceptions, doc stays valid",
  stress.errors === 0 && stress.valid === true,
  `errors=${stress.errors} valid=${stress.valid} size=${stress.size}`
);
check(
  "no uncaught page errors during stress",
  pageErrors === 0,
  `pageErrors=${pageErrors}`
);
// after stress, scroll through and ensure it still renders/materializes
await t("window.__t.scrollToTop()");
await page.waitForTimeout(300);
check(
  "still virtualizing after stress (some placeholders remain)",
  (await t("window.__t.placeholderCount()")) > 0,
  `placeholders=${await t("window.__t.placeholderCount()")}`
);

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(
  `\n${results.length - failed.length}/${results.length} passed` +
    (failed.length ? `, FAILURES: ${failed.map((f) => f.name).join("; ")}` : "")
);
process.exit(failed.length ? 1 : 0);
