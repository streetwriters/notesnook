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
import { promises as fs } from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(
  new URL(import.meta.url).pathname,
  "..",
  ".."
); // scripts/.. -> mobile

const REPO_ROOT = path.resolve(PROJECT_ROOT, "..", ".."); // mobile/../.. -> repo root
const IOS_BUILD_CONFIGS_DIR = path.resolve(PROJECT_ROOT, "ios/build-configs");
const ANDROID_GRADLE = path.resolve(PROJECT_ROOT, "android/app/build.gradle");
const PACKAGE_JSON = path.resolve(PROJECT_ROOT, "package.json");
const FDROID_CHANGELOGS_DIR = path.resolve(
  REPO_ROOT,
  "fastlane/metadata/android/en-US/changelogs"
);

async function resolveVersion() {
  const provided = process.argv[2];
  if (provided) {
    if (!/^\d+\.\d+\.\d+$/.test(provided)) {
      console.error(`Invalid version "${provided}". Expected format: x.y.z`);
      process.exit(1);
    }
    return provided;
  }
  // No version provided: bump the current package.json version as a patch.
  const pkg = JSON.parse(await fs.readFile(PACKAGE_JSON, "utf8"));
  const match = String(pkg.version).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    console.error(
      `Cannot auto-bump: package.json version "${pkg.version}" is not x.y.z`
    );
    process.exit(1);
  }
  const [, major, minor, patch] = match;
  return `${major}.${minor}.${Number(patch) + 1}`;
}

const version = await resolveVersion();

async function updatePackageJson() {
  const raw = await fs.readFile(PACKAGE_JSON, "utf8");
  const pkg = JSON.parse(raw);
  const from = pkg.version;
  pkg.version = version;
  // Preserve trailing newline if present.
  const trailingNewline = raw.endsWith("\n") ? "\n" : "";
  await fs.writeFile(
    PACKAGE_JSON,
    JSON.stringify(pkg, null, 2) + trailingNewline
  );
  console.log(`package.json: version ${from} -> ${version}`);
}

async function updateAndroid() {
  let content = await fs.readFile(ANDROID_GRADLE, "utf8");
  const match = content.match(/versionCode\s+(\d+)/);
  if (!match) {
    throw new Error("Could not find `versionCode <number>` in build.gradle");
  }
  const current = parseInt(match[1], 10);
  const next = current + 1;
  content = content.replace(match[0], `versionCode ${next}`);
  await fs.writeFile(ANDROID_GRADLE, content);
  console.log(`android/app/build.gradle: versionCode ${current} -> ${next}`);
  return next;
}

// Derives the F-Droid release version code from build.gradle. F-Droid builds a
// separate APK per ABI (see `applicationVariants.all` in build.gradle) using:
//   output.versionCodeOverride = defaultConfig.versionCode * <mult> + versionCodes[abi]
// and publishes the highest of those. So the changelog file is named after
// `versionCode * <mult> + max(versionCodes)`. Both are parsed here rather than
// hardcoded so this stays in sync with the formula in build.gradle.
async function computeFdroidVersionCode(versionCode) {
  const gradle = await fs.readFile(ANDROID_GRADLE, "utf8");

  const multMatch = gradle.match(/defaultConfig\.versionCode\s*\*\s*(\d+)/);
  if (!multMatch) {
    throw new Error(
      "Could not find the F-Droid versionCode multiplier in build.gradle"
    );
  }
  const multiplier = parseInt(multMatch[1], 10);

  const mapMatch = gradle.match(/versionCodes\s*=\s*\[([^\]]*)\]/);
  if (!mapMatch) {
    throw new Error("Could not find the ABI versionCodes map in build.gradle");
  }
  const abiCodes = [...mapMatch[1].matchAll(/:\s*(\d+)/g)].map((m) =>
    parseInt(m[1], 10)
  );
  if (abiCodes.length === 0) {
    throw new Error("ABI versionCodes map in build.gradle is empty");
  }
  const maxAbiCode = Math.max(...abiCodes);

  return versionCode * multiplier + maxAbiCode;
}

async function createFdroidChangelog(versionCode) {
  const fdroidVersionCode = await computeFdroidVersionCode(versionCode);
  const file = path.resolve(FDROID_CHANGELOGS_DIR, `${fdroidVersionCode}.txt`);
  const rel = path.relative(REPO_ROOT, file);

  try {
    await fs.access(file);
    console.log(`${rel}: already exists, skipped`);
    return;
  } catch {
    // File does not exist yet — create it.
  }

  const placeholder = "- Minor bug fixes and improvements\n\nThank you for using Notesnook!\n";
  await fs.mkdir(FDROID_CHANGELOGS_DIR, { recursive: true });
  await fs.writeFile(file, placeholder);
  console.log(`${rel}: created (edit with this release's changelog)`);
}

async function updateIosConfig(file) {
  let content = await fs.readFile(file, "utf8");
  const rel = path.relative(PROJECT_ROOT, file);

  const buildMatch = content.match(/IOS_CURRENT_PROJECT_VERSION\s*=\s*(\d+)/);
  if (!buildMatch) {
    throw new Error(`Could not find IOS_CURRENT_PROJECT_VERSION in ${rel}`);
  }
  const currentBuild = parseInt(buildMatch[1], 10);
  const nextBuild = currentBuild + 1;
  content = content.replace(
    buildMatch[0],
    `IOS_CURRENT_PROJECT_VERSION = ${nextBuild}`
  );

  const marketingMatch = content.match(/IOS_MARKETING_VERSION\s*=\s*(\S+)/);
  if (!marketingMatch) {
    throw new Error(`Could not find IOS_MARKETING_VERSION in ${rel}`);
  }
  const currentMarketing = marketingMatch[1];
  content = content.replace(
    marketingMatch[0],
    `IOS_MARKETING_VERSION = ${version}`
  );

  await fs.writeFile(file, content);
  console.log(
    `${rel}: version ${currentMarketing} -> ${version}, build ${currentBuild} -> ${nextBuild}`
  );
}

async function updateIos() {
  const entries = await fs.readdir(IOS_BUILD_CONFIGS_DIR);
  const configs = entries.filter((e) => e.endsWith(".xcconfig"));
  if (configs.length === 0) {
    throw new Error("No .xcconfig files found in ios/build-configs");
  }
  for (const config of configs) {
    await updateIosConfig(path.resolve(IOS_BUILD_CONFIGS_DIR, config));
  }
}

async function run() {
  console.log(`Bumping to version ${version}...\n`);
  await updatePackageJson();
  const androidVersionCode = await updateAndroid();
  await updateIos();
  await createFdroidChangelog(androidVersionCode);
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Failed:", err?.message || err);
  process.exitCode = 1;
});
