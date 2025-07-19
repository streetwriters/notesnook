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
import { cp, mkdir, readFile, rm, rmdir, writeFile } from "fs/promises";
import { fileURLToPath } from "node:url";
import path, { join, resolve } from "path";
import { _electron as electron } from "playwright";
import slugify from "slugify";
import { test as vitestTest, TestContext } from "vitest";
import { patchBetterSQLite3 } from "../scripts/patch-better-sqlite3.mjs";
import { existsSync } from "fs";

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
  }
});

export async function testCleanup(context: TestContext) {
  const ctx = (context.task.context as unknown as Fixtures).ctx;
  if (context.task.result?.state === "fail") {
    await mkdir("test-results", { recursive: true });
    await ctx.page.screenshot({
      path: path.join(
        "test-results",
        `${slugify(context.task.name)}-${process.platform}-${
          process.arch
        }-error.png`
      )
    });
  }
  await ctx.app.close();
  await rmdir(ctx.userDataDir, { recursive: true });
  await rmdir(ctx.outputDir, { recursive: true });
}

async function buildAndLaunchApp(options?: TestOptions): Promise<AppContext> {
  const productName = `notesnooktest${makeid(10)}`;
  const outputDir = path.join("test-artifacts", `${productName}-output`);
  const executablePath = await buildApp({
    ...options,
    outputDir
  });
  const { app, page, configPath, userDataDir } = await launchApp(
    executablePath,
    productName
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
        productName
      );
      ctx.app = app;
      ctx.page = page;
      ctx.userDataDir = userDataDir;
      ctx.configPath = configPath;
    }
  };
  return ctx;
}

async function launchApp(executablePath: string, packageName: string) {
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
      CUSTOM_USER_DATA_DIR: userDataDir
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

async function buildApp({
  version,
  outputDir
}: {
  version?: string;
  outputDir: string;
}) {
  const productName = `NotesnookTestHarness`;
  const sourceDir = resolve("output", productName);
  if (!existsSync(sourceDir)) {
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
        NN_OUTPUT_DIR: sourceDir
      }
    });
  }
  return process.platform === "win32"
    ? await copyBuildWindows(sourceDir, outputDir, productName, version)
    : process.platform === "darwin"
    ? await copyBuildMacOS(sourceDir, outputDir, productName, version)
    : await copyBuildLinux(sourceDir, outputDir, productName, version);
}

async function copyBuildLinux(
  sourceDir: string,
  outputDir: string,
  productName: string,
  version?: string
) {
  const platformDir =
    process.arch === "arm64" ? "linux-arm64-unpacked" : "linux-unpacked";
  const appDir = await copyBuild(
    sourceDir,
    outputDir,
    platformDir,
    "resources",
    version
  );
  return resolve(__dirname, "..", appDir, productName);
}

async function copyBuildWindows(
  sourceDir: string,
  outputDir: string,
  productName: string,
  version?: string
) {
  const platformDir =
    process.arch === "arm64" ? "win-arm64-unpacked" : "win-unpacked";
  const appDir = await copyBuild(
    sourceDir,
    outputDir,
    platformDir,
    "resources",
    version
  );
  return resolve(__dirname, "..", appDir, `${productName}.exe`);
}

async function copyBuildMacOS(
  sourceDir: string,
  outputDir: string,
  productName: string,
  version?: string
) {
  const platformDir = process.arch === "arm64" ? "mac-arm64" : "mac";
  const appDir = await copyBuild(
    sourceDir,
    outputDir,
    platformDir,
    join(`${productName}.app`, "Contents", "Resources"),
    version
  );
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

async function copyBuild(
  sourceDir: string,
  outputDir: string,
  platformDir: string,
  resourcesDir: string,
  version?: string
) {
  const appDir = outputDir;
  await cp(join(sourceDir, platformDir), outputDir, {
    recursive: true,
    preserveTimestamps: true,
    verbatimSymlinks: true,
    dereference: false,
    force: true
  });

  const packageJsonPath = join(appDir, resourcesDir, "app", "package.json");

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
  if (version) {
    packageJson.version = version;
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

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
