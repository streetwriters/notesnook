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
import { cp } from "fs/promises";
import { fileURLToPath } from "node:url";
import path, { join, resolve } from "path";
import { _electron as electron } from "playwright";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_DEBUG = process.env.NN_DEBUG === "true" || process.env.CI === "true";
const productName = `NotesnookTestHarness`;
const SOURCE_DIR = resolve("output", productName);

export interface AppContext {
  app: import("playwright").ElectronApplication;
  page: import("playwright").Page;
  configPath: string;
  userDataDir: string;
  outputDir: string;
  relaunch: () => Promise<void>;
}

export interface TestOptions {
  version: string;
}

export interface Fixtures {
  options: TestOptions;
  ctx: AppContext;
}

export async function buildAndLaunchApp(
  options?: TestOptions
): Promise<AppContext> {
  const productName = `notesnooktest${makeid(10)}`;
  const outputDir = path.join("test-artifacts", `${productName}-output`);
  const executablePath = await copyBuild({
    ...options,
    outputDir
  });
  const { app, page, configPath, userDataDir } = await launchApp(
    executablePath,
    productName,
    options?.version
  );
  const ctx: AppContext = {
    app,
    page,
    configPath,
    userDataDir,
    outputDir,
    relaunch: async () => {
      const { app, page, configPath, userDataDir } = await launchApp(
        executablePath,
        productName,
        options?.version
      );
      ctx.app = app;
      ctx.page = page;
      ctx.userDataDir = userDataDir;
      ctx.configPath = configPath;
    }
  };
  return ctx;
}

async function launchApp(
  executablePath: string,
  packageName: string,
  version?: string
) {
  const userDataDir = resolve(
    __dirname,
    "..",
    "test-artifacts",
    "user_data_dirs",
    packageName
  );
  const app = await electron.launch({
    executablePath,
    args: IS_DEBUG ? [] : ["--hidden"],
    env: {
      ...(process.platform === "linux"
        ? {
            ...(process.env as Record<string, string>),
            APPIMAGE: "true"
          }
        : (process.env as Record<string, string>)),
      CUSTOM_USER_DATA_DIR: userDataDir,
      ...(version
        ? {
            CUSTOM_APP_VERSION: version
          }
        : {})
    }
  });

  const page = await app.firstWindow();

  const configPath = path.join(userDataDir, "UserData", "config.json");
  return {
    app,
    page,
    configPath,
    userDataDir
  };
}

let MAX_RETRIES = 3;
export async function buildApp(version?: string) {
  if (!existsSync(SOURCE_DIR)) {
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
    try {
      execSync(`npx ${args.join(" ")}`, {
        stdio: IS_DEBUG ? "inherit" : "ignore",
        env: {
          ...process.env,
          NOTESNOOK_STAGING: "true",
          NN_PRODUCT_NAME: productName,
          NN_APP_ID: `com.notesnook.test.${productName}`,
          NN_OUTPUT_DIR: SOURCE_DIR
        }
      });
    } catch (e) {
      if (--MAX_RETRIES) {
        console.log("retrying...");
        return await buildApp(version);
      } else throw e;
    }
  }
}

async function copyBuild({ outputDir }: { outputDir: string }) {
  return process.platform === "win32"
    ? await makeBuildCopyWindows(outputDir, productName)
    : process.platform === "darwin"
    ? await makeBuildCopyMacOS(outputDir, productName)
    : await makeBuildCopyLinux(outputDir, productName);
}

async function makeBuildCopyLinux(outputDir: string, productName: string) {
  const platformDir =
    process.arch === "arm64" ? "linux-arm64-unpacked" : "linux-unpacked";
  const appDir = await makeBuildCopy(outputDir, platformDir);
  return resolve(
    __dirname,
    "..",
    appDir,
    productName.toLowerCase().replace(/\s+/g, "-")
  );
}

async function makeBuildCopyWindows(outputDir: string, productName: string) {
  const platformDir =
    process.arch === "arm64" ? "win-arm64-unpacked" : "win-unpacked";
  const appDir = await makeBuildCopy(outputDir, platformDir);
  return resolve(__dirname, "..", appDir, `${productName}.exe`);
}

async function makeBuildCopyMacOS(outputDir: string, productName: string) {
  const platformDir = process.arch === "arm64" ? "mac-arm64" : "mac";
  const appDir = await makeBuildCopy(outputDir, platformDir);
  return resolve(
    __dirname,
    "..",
    appDir,
    `${productName}.app`,
    "Contents",
    "MacOS",
    productName
  );
}

async function makeBuildCopy(outputDir: string, platformDir: string) {
  const appDir = outputDir;
  await cp(join(SOURCE_DIR, platformDir), outputDir, {
    recursive: true,
    preserveTimestamps: true,
    verbatimSymlinks: true,
    dereference: false,
    force: true
  });

  return appDir;
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
