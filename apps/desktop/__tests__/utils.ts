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
import { mkdir } from "fs/promises";
import path from "path";
import { _electron as electron } from "playwright";
import slugify from "slugify";
import { TaskContext } from "vitest";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const IS_DEBUG = process.env.NN_DEBUG === "true" || process.env.CI === "true";

interface AppContext {
  app: import("playwright").ElectronApplication;
  page: import("playwright").Page;
  configPath: string;
  relaunch: () => Promise<void>;
}

interface TestOptions {
  version: string;
}

export async function harness(
  t: TaskContext,
  cb: (ctx: AppContext) => Promise<void>,
  options?: TestOptions
) {
  const ctx = await buildAndLaunchApp(options);

  t.onTestFinished(async (result) => {
    if (result.state === "fail") {
      await mkdir("test-results", { recursive: true });
      await ctx.page.screenshot({
        path: path.join(
          "test-results",
          `${slugify(t.task.name)}-${process.platform}-${
            process.arch
          }-error.png`
        )
      });
    }
    await ctx.app.close();
  });

  await cb(ctx);
}

async function buildAndLaunchApp(options?: TestOptions): Promise<AppContext> {
  const productName = makeid(10);
  const executablePath = await buildApp({ ...options, productName });
  const { app, page, configPath } = await launchApp(executablePath);
  const ctx: AppContext = {
    app,
    page,
    configPath,
    relaunch: async () => {
      const { app, page, configPath } = await launchApp(executablePath);
      ctx.app = app;
      ctx.page = page;
      ctx.configPath = configPath;
    }
  };
  return ctx;
}

async function launchApp(executablePath: string) {
  const app = await electron.launch({
    executablePath,
    args: IS_DEBUG ? [] : ["--hidden"]
  });

  const page = await app.firstWindow();

  const userDataDirectory = await app.evaluate((a) => {
    return a.app.getPath("userData");
  });
  const configPath = path.join(userDataDirectory, "config.json");
  return {
    app,
    page,
    configPath
  };
}

async function buildApp({
  version,
  productName
}: {
  version?: string;
  productName: string;
}) {
  const buildRoot = path.join("test-artifacts", `${productName}-build`);
  const output = path.join("test-artifacts", `${productName}-output`);
  execSync(`npm run release -- --root ${buildRoot} --skip-tsc-build`, {
    stdio: IS_DEBUG ? "inherit" : "ignore"
  });

  const args = [
    `--config electron-builder.config.js`,
    `--c.extraMetadata.productName=${productName}`,
    "--publish=never"
  ];
  if (version) args.push(`--c.extraMetadata.version=${version}`);

  execSync(`npx electron-builder --dir --${process.arch} ${args.join(" ")}`, {
    stdio: IS_DEBUG ? "inherit" : "ignore",
    env: {
      ...process.env,
      NOTESNOOK_STAGING: "true",
      NN_BUILD_ROOT: buildRoot,
      NN_PRODUCT_NAME: productName,
      NN_APP_ID: `com.notesnook.test.${productName}`,
      NN_OUTPUT_DIR: output
    }
  });

  return path.join(
    __dirname,
    "..",
    output,
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
