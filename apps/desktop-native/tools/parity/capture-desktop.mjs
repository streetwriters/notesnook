import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { scenarios } from "./scenarios.mjs";

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
process.env.RN_GPUI_TEST_BUNDLE ??= path.join(appDir, "desktop/build/index.bundle");
process.env.RN_GPUI_TEST_BINARY ??= path.join(
  appDir,
  "desktop/build/target/debug/react-native-gpui--notesnook-desktop-native"
);

const app = await launchApp({
  disableAnimations: true,
  timeout: 120000,
  initialProps: { seed, resetConfig: true, initialColorScheme: scheme },
  env: {
    RN_GPUI_APP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "parity-"))
  }
});

const argb = (value) => {
  const v = value >>> 0;
  return [(v >>> 16) & 255, (v >>> 8) & 255, v & 255, ((v >>> 24) & 255) / 255];
};

try {
  await app.setWindowSize(scenario.size[0], scenario.size[1]);
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if ((await app.query("testID", "title", true)).length >= 5) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  await app.mouseMove({ x: 2, y: 2 });
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
      console.log(
        `${"  ".repeat(depth)}${node.component} ${node.testID || ""} [${f.x},${f.y},${f.width},${f.height}] ${props.text ? JSON.stringify(props.text) : ""}`
      );
      for (const child of node.children ?? []) await dump(child, depth + 1);
    };
    const find = (node) =>
      node.testID === process.env.PARITY_DUMP
        ? node
        : (node.children ?? []).map(find).find(Boolean);
    const root = find(tree);
    if (root) await dump(root, 0);
  }
  const elements = [];
  const textRects = [];
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
    if (!node.testID) continue;
    elements.push({
      id: node.testID,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      background: argb(props.backgroundColor ?? 0),
      color: null,
      borderColor: null,
      borderWidth: props.borderWidths?.top ?? 0,
      fontFamily: fragment?.fontFamily ?? null,
      fontSize: fragment?.fontSize ?? null,
      fontWeight: fragment?.fontWeight ?? null,
      lineHeight: null,
      letterSpacing: null,
      text: (props.text ?? "").slice(0, 40)
    });
  }
  fs.writeFileSync(path.join(outDir, "desktop.png"), await app.screenshot());
  fs.writeFileSync(
    path.join(outDir, "desktop-map.json"),
    JSON.stringify({ elements, textRects }, null, 1)
  );
} finally {
  await app.close();
}
