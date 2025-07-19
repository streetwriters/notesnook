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

import { execSync } from "child_process";
import { mkdir, rm } from "fs/promises";
import { fileURLToPath } from "node:url";
import path from "path";
import { _electron as electron } from "playwright";
import slugify from "slugify";
import { test as vitestTest, TestContext } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_DEBUG = process.env.NN_DEBUG === "true" || process.env.CI === "true";

interface AppContext {
  app: import("playwright").ElectronApplication;
  page: import("playwright").Page;
  configPath: string;
  userDataDir: string;
  outputDir: string;
  relaunch: () => Promise<void>;
}

interface TestOptions {
  version: string;
}

interface Fixtures {
  options: TestOptions;
  ctx: AppContext;
}

export const test = vitestTest.extend<Fixtures>({
  options: { version: "3.0.0" } as TestOptions,
  ctx: async ({ options }, use) => {
    const ctx = await buildAndLaunchApp(options);
    await use(ctx);
    await ctx.app.close();
    await rm(ctx.userDataDir, { recursive: true, force: true });
    await rm(ctx.outputDir, { recursive: true, force: true });
  }
});

export async function testCleanup(context: TestContext) {
  if (context.task.result?.state === "fail") {
    await mkdir("test-results", { recursive: true });
    await (context.task.context as unknown as Fixtures).ctx.page.screenshot({
      path: path.join(
        "test-results",
        `${slugify(context.task.name)}-${process.platform}-${
          process.arch
        }-error.png`
      )
    });
  }
}

async function buildAndLaunchApp(options?: TestOptions): Promise<AppContext> {
  const productName = `notesnooktest${makeid(10)}`;
  const outputDir = path.join("test-artifacts", `${productName}-output`);
  const executablePath = await buildApp({
    ...options,
    productName,
    outputDir
  });
  const { app, page, configPath, userDataDir } = await launchApp(
    executablePath
  );
  const ctx: AppContext = {
    app,
    page,
    configPath,
    userDataDir,
    outputDir,
    relaunch: async () => {
      const { app, page, configPath, userDataDir } = await launchApp(
        executablePath
      );
      ctx.app = app;
      ctx.page = page;
      ctx.userDataDir = userDataDir;
      ctx.configPath = configPath;
    }
  };
  return ctx;
}

async function launchApp(executablePath: string) {
  const app = await electron.launch({
    executablePath,
    args: IS_DEBUG ? [] : ["--hidden"],
    env:
      process.platform === "linux"
        ? {
            ...(process.env as Record<string, string>),
            APPIMAGE: "true"
          }
        : (process.env as Record<string, string>)
  });

  const page = await app.firstWindow();

  const userDataDir = await app.evaluate((a) => {
    return a.app.getPath("userData");
  });
  const configPath = path.join(userDataDir, "config.json");
  return {
    app,
    page,
    configPath,
    userDataDir
  };
}

async function buildApp({
  version,
  productName,
  outputDir
}: {
  version?: string;
  productName: string;
  outputDir: string;
}) {
  const args = [
    "electron-builder",
    "--dir",
    `--${process.arch}`,
    `--config electron-builder.config.js`,
    `--c.extraMetadata.productName=${productName}`,
    `--c.compression=store`,
    "--publish=never"
  ];
  if (version) args.push(`--c.extraMetadata.version=${version}`);

  execSync(`npx ${args.join(" ")}`, {
    stdio: IS_DEBUG ? "inherit" : "ignore",
    env: {
      ...process.env,
      NOTESNOOK_STAGING: "true",
      NN_PRODUCT_NAME: productName,
      NN_APP_ID: `com.notesnook.test.${productName}`,
      NN_OUTPUT_DIR: outputDir
    }
  });

  return path.join(
    __dirname,
    "..",
    outputDir,
    process.platform === "linux"
      ? process.arch === "arm64"
        ? "linux-arm64-unpacked"
        : "linux-unpacked"
      : process.platform === "darwin"
      ? process.arch === "arm64"
        ? `mac-arm64/${productName}.app/Contents/MacOS/`
        : `mac/${productName}.app/Contents/MacOS/`
      : "win-unpacked",
    process.platform === "win32" ? `${productName}.exe` : productName
  );
}

function makeid(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result.toLowerCase();
}
