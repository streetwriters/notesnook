import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "../..");
const require = createRequire(path.join(appDir, "package.json"));
const { launchApp } = await import(
  require.resolve("@react-native-gpui/testing")
);

process.env.RN_GPUI_TEST_PROJECT = appDir;
process.env.RN_GPUI_TEST_BUNDLE ??= path.join(appDir, "desktop/build/index.bundle");
process.env.RN_GPUI_TEST_BINARY ??= path.join(
  appDir,
  "desktop/build/target/debug/react-native-gpui--notesnook-desktop-native"
);

const app = await launchApp({
  disableAnimations: true,
  timeout: 120000,
  initialProps: {
    resetConfig: true,
    seed: [{ title: "Note", content: "Body" }]
  },
  env: {
    RN_GPUI_APP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "nav-frames-")),
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

try {
  await app.setWindowSize(1200, 800);
  for (let i = 0; i < 100; i++) {
    if ((await app.getByTestId("app").count()) > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await app.waitForIdle();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const tree = await app.tree();
  const lines = [];
  const walk = (node, path) => {
    const next = [...path, node];
    if (node.testID === "navigation-item") {
      if (!lines.length)
        for (const ancestor of next.slice(-8))
          lines.push(
            `${ancestor.testID || ancestor.type || "view"} ${JSON.stringify(ancestor.frame)}`
          );
      return;
    }
    for (const child of node.children ?? []) walk(child, next);
  };
  walk(tree, []);
  console.log(lines.join("\n"));
  const items = await app.query("testID", "navigation-item", true);
  const titles = await app.query("testID", "title", true);
  console.log(
    "items",
    JSON.stringify(items.slice(0, 5).map((m) => m.frame)),
    "\ntitles",
    JSON.stringify(titles.slice(0, 5).map((m) => [m.text, m.frame.width]))
  );
} finally {
  await app.close();
}
