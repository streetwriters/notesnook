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
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

// Resolve important directory paths relative to this script
const androidDir = path.resolve(__dirname, "..");
const mobileDir = path.resolve(androidDir, "..");
const rootDir = path.resolve(mobileDir, "..", "..");
const prebuiltDir = path.join(androidDir, ".prebuilt-aars");

// Library registry configuration
// gradleProject: Gradle project name (defaults to lib name with @ stripped and / replaced with _)
// filePrefix: Output file prefix (defaults to lib name with @ stripped and / replaced with -)
// customFlagsProp: gradle.properties property key containing extra compile flags
const ALL_LIBRARIES = {
  "react-native-quick-sqlite": {
    gradleProject: "react-native-quick-sqlite",
    filePrefix: "react-native-quick-sqlite",
    customFlagsProp: "quickSqliteFlags"
  },
  "react-native-fast-openpgp": {
    gradleProject: "react-native-fast-openpgp",
    filePrefix: "react-native-fast-openpgp"
  },
  "react-native-screens": {
    gradleProject: "react-native-screens",
    filePrefix: "react-native-screens"
  },
  "react-native-gesture-handler": {
    gradleProject: "react-native-gesture-handler",
    filePrefix: "react-native-gesture-handler"
  },
  "react-native-mmkv-storage": {
    gradleProject: "react-native-mmkv-storage",
    filePrefix: "react-native-mmkv-storage"
  },
  "@callstack/repack": {
    gradleProject: "callstack_repack",
    filePrefix: "callstack-repack"
  },
  "react-native-nitro-modules": {
    gradleProject: "react-native-nitro-modules",
    filePrefix: "react-native-nitro-modules"
  },
  "react-native-nitro-cloud-uploader": {
    gradleProject: "react-native-nitro-cloud-uploader",
    filePrefix: "react-native-nitro-cloud-uploader"
  },
  "react-native-worklets": {
    gradleProject: "react-native-worklets",
    filePrefix: "react-native-worklets"
  },
  "react-native-reanimated": {
    gradleProject: "react-native-reanimated",
    filePrefix: "react-native-reanimated"
  }
};

// All configured prebuilt libraries in dependency order
const ACTIVE_LIBRARIES = [
  "react-native-quick-sqlite",
  "react-native-fast-openpgp",
  "react-native-screens",
  "react-native-gesture-handler",
  "react-native-mmkv-storage",
  "react-native-nitro-modules",
  "react-native-nitro-cloud-uploader",
  "react-native-worklets",
  "react-native-reanimated"
];

function computeHash(libName) {
  const libConfig = ALL_LIBRARIES[libName] || {
    gradleProject: libName.replace(/^@/, "").replace(/\//g, "_"),
    filePrefix: libName.replace(/^@/, "").replace(/\//g, "-")
  };

  // 1. Library version from its package.json
  const libPkgPath = path.join(
    mobileDir,
    "node_modules",
    libName,
    "package.json"
  );
  if (!fs.existsSync(libPkgPath)) {
    throw new Error(
      `Cannot find package.json for library: ${libName} at ${libPkgPath}`
    );
  }
  const libVersion = JSON.parse(fs.readFileSync(libPkgPath, "utf8")).version;

  // 2. React Native version
  const rnPkgPath = path.join(
    mobileDir,
    "node_modules",
    "react-native",
    "package.json"
  );
  const rnVersion = fs.existsSync(rnPkgPath)
    ? JSON.parse(fs.readFileSync(rnPkgPath, "utf8")).version
    : "";

  // 3. Flags and architectures from gradle.properties
  const gradlePropsPath = path.join(androidDir, "gradle.properties");
  const gradleProps = fs.existsSync(gradlePropsPath)
    ? fs.readFileSync(gradlePropsPath, "utf8")
    : "";
  const newArch =
    (gradleProps.match(/^newArchEnabled\s*=\s*(.+)$/m) || [])[1]?.trim() || "";
  const hermes =
    (gradleProps.match(/^hermesEnabled\s*=\s*(.+)$/m) || [])[1]?.trim() || "";
  const archs =
    (gradleProps.match(/^reactNativeArchitectures\s*=\s*(.+)$/m) ||
      [])[1]?.trim() || "";

  // 4. NDK version from build.gradle
  const buildGradlePath = path.join(androidDir, "build.gradle");
  const buildGradle = fs.existsSync(buildGradlePath)
    ? fs.readFileSync(buildGradlePath, "utf8")
    : "";
  const ndkMatch = buildGradle.match(/ndkVersion\s*=\s*['"]([^'"]+)['"]/);
  const ndkVersion = ndkMatch ? ndkMatch[1] : "";

  // 5. Library-specific custom flags if configured
  let customFlags = "";
  if (libConfig.customFlagsProp) {
    const re = new RegExp(`^${libConfig.customFlagsProp}\\s*=\\s*(.+)$`, "m");
    customFlags = (gradleProps.match(re) || [])[1]?.trim() || "";
  }

  // 6. Relevant patch files from apps/mobile/patches
  const patchesDir = path.join(mobileDir, "patches");
  const patchPrefix = libName.replace(/\//g, "+");
  let patchContent = "";
  if (fs.existsSync(patchesDir)) {
    const patchFiles = fs
      .readdirSync(patchesDir)
      .filter((f) => f.startsWith(patchPrefix) && f.endsWith(".patch"))
      .sort();
    patchContent = patchFiles
      .map((f) => fs.readFileSync(path.join(patchesDir, f), "utf8"))
      .join("\n");
  }

  const hash = crypto.createHash("sha1");
  hash.update(`lib:${libName}@${libVersion}\n`);
  hash.update(`rn:${rnVersion}\n`);
  hash.update(`archs:${archs}\n`);
  hash.update(`newArch:${newArch}\n`);
  hash.update(`hermes:${hermes}\n`);
  hash.update(`ndk:${ndkVersion}\n`);
  if (customFlags) {
    hash.update(`custom:${customFlags}\n`);
  }
  hash.update(`patch:${patchContent}\n`);

  return hash.digest("hex").substring(0, 8);
}

function buildPrebuiltAar(libName, targetVariant) {
  if (!fs.existsSync(prebuiltDir)) {
    fs.mkdirSync(prebuiltDir, { recursive: true });
  }

  const libConfig = ALL_LIBRARIES[libName] || {
    gradleProject: libName.replace(/^@/, "").replace(/\//g, "_"),
    filePrefix: libName.replace(/^@/, "").replace(/\//g, "-")
  };

  const hash = computeHash(libName);
  const variants = targetVariant ? [targetVariant] : ["debug", "release"];

  // Read target ABIs
  const gradlePropsPath = path.join(androidDir, "gradle.properties");
  const gradleProps = fs.existsSync(gradlePropsPath)
    ? fs.readFileSync(gradlePropsPath, "utf8")
    : "";
  const archs =
    (gradleProps.match(/^reactNativeArchitectures\s*=\s*(.+)$/m) ||
      [])[1]?.trim() || "armeabi-v7a,arm64-v8a,x86,x86_64";

  for (const variant of variants) {
    const aarFileName = `${libConfig.filePrefix}-${variant}-${hash}.aar`;
    const targetPath = path.join(prebuiltDir, aarFileName);

    if (fs.existsSync(targetPath)) {
      console.log(`[SKIP] Prebuilt AAR already exists: ${aarFileName}`);
      continue;
    }

    const taskVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    const task = `:${libConfig.gradleProject}:assemble${taskVariant}`;
    console.log(`[BUILD] Running ${task} for ${libName} (hash: ${hash})...`);

    // Invalidate autolinking cache prior to build to avoid stale state
    const autolinkCache = path.join(
      androidDir,
      "build",
      "generated",
      "autolinking"
    );
    if (fs.existsSync(autolinkCache)) {
      fs.rmSync(autolinkCache, { recursive: true, force: true });
    }

    execSync(`./gradlew ${task} -PreactNativeArchitectures=${archs}`, {
      cwd: androidDir,
      stdio: "inherit",
      env: {
        ...process.env,
        BUILDING_PREBUILT_AARS: "true"
      }
    });

    const aarOutputDir = path.join(
      mobileDir,
      "node_modules",
      libName,
      "android",
      "build",
      "outputs",
      "aar"
    );

    if (!fs.existsSync(aarOutputDir)) {
      throw new Error(
        `AAR output dir not found for ${libName} at ${aarOutputDir}`
      );
    }

    const aarFiles = fs
      .readdirSync(aarOutputDir)
      .filter((f) => f.endsWith(".aar"));
    const matchedAar = aarFiles.find((f) => f.includes(variant)) || aarFiles[0];
    if (!matchedAar) {
      throw new Error(`No .aar file generated in ${aarOutputDir}`);
    }

    fs.copyFileSync(path.join(aarOutputDir, matchedAar), targetPath);
    console.log(`[COPIED] -> ${targetPath}`);
  }

  // Refresh autolinking cache state and touch react-native.config.js
  const autolinkCache = path.join(
    androidDir,
    "build",
    "generated",
    "autolinking"
  );
  if (fs.existsSync(autolinkCache)) {
    fs.rmSync(autolinkCache, { recursive: true, force: true });
  }
  const configPath = path.join(mobileDir, "react-native.config.js");
  if (fs.existsSync(configPath)) {
    const now = new Date();
    fs.utimesSync(configPath, now, now);
  }
}

function findPrebuiltAars() {
  const result = {};
  for (const lib of ACTIVE_LIBRARIES) {
    try {
      const hash = computeHash(lib);
      const { filePrefix } = ALL_LIBRARIES[lib];
      const debug = path.join(prebuiltDir, `${filePrefix}-debug-${hash}.aar`);
      const release = path.join(
        prebuiltDir,
        `${filePrefix}-release-${hash}.aar`
      );
      if (fs.existsSync(debug) && fs.existsSync(release)) {
        result[lib] = { debug, release };
      }
    } catch (e) {}
  }
  return result;
}

// CLI Handling
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === "--aars") {
    process.stdout.write(JSON.stringify(findPrebuiltAars()) + "\n");
    process.exit(0);
  }

  const targetLib = args[0];
  const targetVariant = args[1];

  const libsToBuild = targetLib ? [targetLib] : ACTIVE_LIBRARIES;
  for (const lib of libsToBuild) {
    buildPrebuiltAar(lib, targetVariant);
  }
}

module.exports = {
  ALL_LIBRARIES,
  ACTIVE_LIBRARIES,
  computeHash,
  findPrebuiltAars,
  buildPrebuiltAar
};
