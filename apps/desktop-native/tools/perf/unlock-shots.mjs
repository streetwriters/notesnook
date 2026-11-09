import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "../..");
const outDir = path.resolve(appDir, "../../.local/screenshots/unlock");
fs.mkdirSync(outDir, { recursive: true });
const require = createRequire(path.join(appDir, "package.json"));
const { launchApp } = await import(
  require.resolve("@react-native-gpui/testing")
);

process.env.RN_GPUI_TEST_PROJECT = appDir;
process.env.RN_GPUI_TEST_BUNDLE ??= path.join(
  appDir,
  "desktop/build/index-unlock.bundle"
);
process.env.RN_GPUI_TEST_BINARY ??= path.join(
  appDir,
  "desktop/build/target/debug/react-native-gpui--notesnook-desktop-native"
);

const variants = {
  password: { seedAppLockPassword: "password" },
  "security-key": { seedAppLockSecurityKey: true },
  "password-and-security-key": {
    seedAppLockPassword: "password",
    seedAppLockSecurityKey: true
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const scheme of ["light", "dark"]) {
  for (const [name, seed] of Object.entries(variants)) {
    const app = await launchApp({
      disableAnimations: true,
      timeout: 120000,
      initialProps: {
        resetConfig: true,
        initialColorScheme: scheme,
        seed: [{ title: "Hidden note", content: "must not show" }],
        ...seed
      },
      env: {
        RN_GPUI_APP_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "unlock-")),
        RN_GPUI_TEST_DISPLAY: process.env.RN_GPUI_TEST_DISPLAY ?? "retina"
      }
    });
    const killApp = () => {
      try {
        if (app.pid) process.kill(app.pid, "SIGKILL");
      } catch {}
    };
    process.on("exit", killApp);
    try {
      await app.setWindowSize(1200, 800);
      for (let i = 0; i < 120; i++) {
        if (
          (await app.getByTestId("unlock-note-title").count()) > 0 ||
          (await app.getByTestId("app").count()) > 0
        )
          break;
        await sleep(250);
      }
      await app.waitForIdle();
      await sleep(800);
      const save = async (state) =>
        fs.writeFileSync(
          path.join(outDir, `${name}-${state}-${scheme}.png`),
          await app.screenshot()
        );
      await save("initial");
      if (seed.seedAppLockPassword) {
        await app.getByTestId("app-lock-password").type("wrong");
        await app.press("enter");
        await sleep(30);
        await save("busy");
        for (let i = 0; i < 40; i++) {
          if (
            (await app.getByText("Wrong password", { exact: false }).count()) >
            0
          )
            break;
          await sleep(150);
        }
        await app.waitForIdle();
        await sleep(300);
        await save("wrong-password");
      }
      if (seed.seedAppLockSecurityKey) {
        await app.getByTestId("app-lock-use-security-key").click();
        await app.waitForIdle();
        await sleep(500);
        await save("security-key-pin");
        await app.getByTestId("app-lock-security-key-pin").type("1234");
        await app.press("enter");
        for (let i = 0; i < 40; i++) {
          if ((await app.query("testID", "error-text", true)).length > 0) break;
          await sleep(150);
        }
        await app.waitForIdle();
        await sleep(300);
        await save("security-key-error");
      }
    } finally {
      await app.close();
    }
  }
}
console.log("done", fs.readdirSync(outDir).length, "files in", outDir);
