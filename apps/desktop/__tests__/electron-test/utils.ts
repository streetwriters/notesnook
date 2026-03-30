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
import path, { join, resolve } from "path";
import { _electron as electron, ElectronApplication, Page } from "playwright";
import { existsSync } from "fs";
import { mkdir, writeFile } from "node:fs/promises";

const IS_DEBUG = process.env.NN_DEBUG === "true" || process.env.CI === "true";
const productName = `NotesnookTestHarness`;
const root = path.resolve(__dirname, "..", "..");
const SOURCE_DIR = resolve(root, "output", productName);

export interface AppContext {
  app: import("playwright").ElectronApplication;
  userDataDir: string;
  outputDir: string;
  relaunch: () => Promise<void>;
}

export interface TestOptions {
  version: string;
  config?: Record<string, unknown>;
}

export interface Fixtures {
  options: TestOptions;
  ctx: AppContext;
}

export async function buildAndLaunchApp(
  userDataDir: string,
  options?: TestOptions
): Promise<AppContext> {
  await buildApp(options?.version);

  const productName = `notesnooktest${makeid(10)}`;
  const outputDir = path.join(root, "test-artifacts", `${productName}-output`);
  const executablePath = await copyBuild({
    ...options,
    outputDir
  });

  const configPath = path.join(userDataDir, "UserData", "config.json");
  if (options?.config) {
    await mkdir(path.dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify(options.config));
  }

  const { app } = await launchApp(
    executablePath,
    userDataDir,
    options?.version
  );
  const ctx: AppContext = {
    app,
    userDataDir,
    outputDir,
    relaunch: async () => {
      const { app } = await launchApp(
        executablePath,
        userDataDir,
        options?.version
      );
      ctx.app = app;
      ctx.userDataDir = userDataDir;
    }
  };
  return ctx;
}

async function launchApp(
  executablePath: string,
  userDataDir: string,
  version?: string
) {
  const app = await electron.launch({
    executablePath,
    args: IS_DEBUG ? [] : ["--hidden"],
    baseURL: "https://app.notesnook.com",
    acceptDownloads: true,
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

  return {
    app,
    userDataDir
  };
}

export function getAppFromPage(page: Page) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return page.context().app as ElectronApplication;
}

let MAX_RETRIES = 3;
export async function buildApp(version?: string) {
  if (!existsSync(SOURCE_DIR)) {
    execSync(
      `node ${path.join(root, "scripts", "build.mjs")} --test --rebuild`,
      {
        stdio: IS_DEBUG ? "inherit" : "ignore"
      }
    );

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
        console.log("retrying...", e);
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
    root,
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
