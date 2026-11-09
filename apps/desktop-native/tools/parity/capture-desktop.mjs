import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { extras, scenarios } from "./scenarios.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "../..");
const require = createRequire(path.join(appDir, "package.json"));
const { launchApp } = await import(
  require.resolve("@react-native-gpui/testing")
);

const [scenarioName, scheme, outDir, seedFile] = process.argv.slice(2);
const scenario = scenarios[scenarioName];
const seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

process.env.RN_GPUI_TEST_PROJECT = appDir;
process.env.RN_GPUI_TEST_BUNDLE ??= path.join(
  appDir,
  "desktop/build/index.bundle"
);
process.env.RN_GPUI_TEST_BINARY ??= path.join(
  appDir,
  "desktop/build/target/debug/react-native-gpui--notesnook-desktop-native"
);

const app = await launchApp({
  disableAnimations: true,
  timeout: 120000,
  initialProps: {
    seed,
    resetConfig: true,
    titleBarInset: 0,
    initialPath: scenario.initialPath,
    initialHash: scenario.initialHash,
    initialColorScheme: scheme,
    seedNotebooks: scenario.noExtras
      ? []
      : scenario.notebooks ?? extras.notebooks,
    seedTags: scenario.noExtras ? [] : extras.tags,
    seedColors: scenario.noExtras ? [] : extras.colors,
    seedReminders: scenario.reminders ?? []
  },
  env: {
    RN_GPUI_APP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "parity-")),
    RN_GPUI_TEST_DISPLAY: process.env.RN_GPUI_TEST_DISPLAY ?? "retina"
  }
});

const killApp = () => {
  try {
    if (app.pid) process.kill(app.pid, "SIGKILL");
  } catch {}
};
process.on("exit", killApp);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    killApp();
    process.exit(1);
  });

const argb = (value) => {
  const v = value >>> 0;
  return [(v >>> 16) & 255, (v >>> 8) & 255, v & 255, ((v >>> 24) & 255) / 255];
};

try {
  await app.setWindowSize(scenario.size[0], scenario.size[1]);
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (
      seed.length === 0 ||
      (await app.query("testID", "title", true)).length >= 5
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  await app.mouseMove({ x: 2, y: 2 });
  await app.waitForIdle();
  const locate = async (spec) => {
    if (typeof spec === "string")
      return (await app.query("testID", spec, true))[0];
    const matches = await app.query("testID", spec.id, true);
    matches.sort((a, b) => a.frame.y - b.frame.y || a.frame.x - b.frame.x);
    return matches[spec.nth ?? 0];
  };
  for (const step of scenario.steps ?? []) {
    if (step.click) await app.click((await locate(step.click)).tag);
    if (step.expand !== undefined)
      await app.click(
        (
          await locate({ id: "notebook-expand", nth: step.expand })
        ).tag
      );
    if (step.type) {
      const input = await locate(step.type.id);
      await app.click(input.tag);
      await app.typeText(input.tag, step.type.text);
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    if (step.clickText) {
      const entry = (await app.query("testID", "title", true)).find(
        (candidate) =>
          candidate.text === step.clickText &&
          (step.in !== "nav" || candidate.frame.x < 250)
      );
      await app.click(entry.tag);
    }
    if (step.rightClick)
      await app.click((await locate(step.rightClick)).tag, {
        button: "right"
      });
    if (step.press) await app.press(step.press);
    if (step.hover) await app.hover((await locate(step.hover)).tag);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await app.waitForIdle();
  }
  if (!scenario.keepPointer) await app.mouseMove({ x: 2, y: 2 });
  await app.waitForIdle();

  const tree = await app.tree();
  const nodes = [];
  const walk = (node) => {
    nodes.push(node);
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);

  if (process.env.PARITY_DUMP) {
    const dump = async (node, depth, abs) => {
      const props = await app.getProps(node.tag);
      const f = props.frame;
      if (process.env.PARITY_PROPS) console.log(JSON.stringify(props));
      console.log(
        `${"  ".repeat(depth)}${node.component} ${node.testID || ""} [${f.x},${
          f.y
        },${f.width},${f.height}] ${
          props.text ? JSON.stringify(props.text) : ""
        }`
      );
      for (const child of node.children ?? []) await dump(child, depth + 1);
    };
    const find = (node) =>
      (
        process.env.PARITY_DUMP.endsWith("*")
          ? (node.testID || "").startsWith(
              process.env.PARITY_DUMP.slice(0, -1)
            ) && (node.testID || "").length > 20
          : node.testID === process.env.PARITY_DUMP
      )
        ? node
        : (node.children ?? []).map(find).find(Boolean);
    const root = find(tree);
    if (root) await dump(root, 0);
  }
  const elements = [];
  const textRects = [];
  const textNodes = [];
  const inputs = [];
  for (const node of nodes) {
    const isText = node.component === "Paragraph";
    if (!node.testID && !isText) continue;
    const props = await app.getProps(node.tag);
    const fragment = props.paragraphFragments?.[0];
    const frame = props.frame;
    if (isText && frame.width > 0)
      textRects.push({
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height
      });
    if (isText && frame.width > 0 && fragment)
      textNodes.push({
        text: (props.text ?? "").trim().slice(0, 40),
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
        fontFamily: fragment.fontFamily,
        fontSize: fragment.fontSize,
        fontWeight: fragment.fontWeight,
        lineHeight: fragment.lineHeight || null
      });
    if (node.component === "TextInput") {
      const input = await app.getProps(node.tag);
      const shown = input.paragraphFragments?.[0];
      if (shown && input.frame.width > 0)
        inputs.push({
          text: input.text || shown.text,
          isPlaceholder: !input.text,
          x: input.frame.x,
          y: input.frame.y,
          width: input.frame.width,
          height: input.frame.height,
          fontFamily: shown.fontFamily,
          fontSize: shown.fontSize,
          fontWeight: shown.fontWeight,
          id: node.testID ?? null
        });
    }
    if (!node.testID) continue;
    elements.push({
      id: node.testID,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      background: argb(props.backgroundColor ?? 0),
      color: isText ? argb(props.textColor ?? 0) : null,
      borderColor:
        (props.borderWidths?.top ?? 0) > 0
          ? argb(props.borderColors?.top ?? 0)
          : null,
      borderWidth: props.borderWidths?.top ?? 0,
      fontFamily: fragment?.fontFamily ?? null,
      fontSize: fragment?.fontSize ?? null,
      fontWeight: fragment?.fontWeight ?? null,
      lineHeight: fragment?.lineHeight || null,
      letterSpacing: fragment ? fragment.letterSpacing ?? 0 : null,
      text: (props.text ?? "").slice(0, 40)
    });
  }
  let shot = await app.screenshot();
  for (let attempt = 0; attempt < 6; attempt++) {
    await app.waitForIdle();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const next = await app.screenshot();
    if (next.equals(shot)) break;
    shot = next;
  }
  fs.writeFileSync(path.join(outDir, "desktop.png"), shot);
  fs.writeFileSync(
    path.join(outDir, "desktop-map.json"),
    JSON.stringify({ elements, textRects, textNodes, inputs }, null, 1)
  );
} finally {
  await app.close();
}
