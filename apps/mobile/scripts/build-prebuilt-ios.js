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
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const mobileDir = path.resolve(__dirname, "..");
const iosDir = path.join(mobileDir, "ios");
const prebuiltDir = path.join(iosDir, ".prebuilt-xcframeworks");
const cacheDir = path.join(prebuiltDir, ".cache");
const configPath = path.join(iosDir, "prebuilt-libraries.json");

const CONFIG = JSON.parse(fs.readFileSync(configPath, "utf8"));
const LIBRARIES = CONFIG.libraries || {};

const CONFIGURATIONS = {
  debug: { xcode: "Debug" },
  release: { xcode: "Release" }
};

const DEFAULT_CONFIGURATIONS = ["debug", "release"];

// The simulator architectures are compiled together so that create-xcframework
// emits one ios-arm64_x86_64-simulator slice: two separate builds cannot both
// claim the same platform identifier. The artifacts are shared by every checkout
// and by CI, so they carry arm64 simulator even though this Podfile currently
// excludes it.
const SLICES = [
  { sdk: "iphoneos", archs: ["arm64"] },
  { sdk: "iphonesimulator", archs: ["x86_64", "arm64"] }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function libVersion(npmName) {
  const pkg = path.join(mobileDir, "node_modules", npmName, "package.json");
  if (!fs.existsSync(pkg)) {
    throw new Error(`Cannot find package.json for ${npmName} at ${pkg}`);
  }
  return readJson(pkg).version;
}

function rnVersion() {
  const pkg = path.join(mobileDir, "node_modules", "react-native", "package.json");
  return fs.existsSync(pkg) ? readJson(pkg).version : "";
}

function xcodeVersion() {
  const out = execFileSync("xcodebuild", ["-version"], { encoding: "utf8" });
  const match = out.match(/^Xcode\s+(\S+)/m);
  return match ? match[1] : out.trim();
}

// Resolved the same way the Podfile resolves them, so that an artifact built by
// hand and an artifact looked up from `pod install` hash identically.
function rnPrebuiltState() {
  if (process.env.NN_USE_PREBUILT_IOS === "0") {
    return { rncore: "0", rndep: "0" };
  }
  return {
    rncore: process.env.RCT_USE_PREBUILT_RNCORE || "1",
    rndep: process.env.RCT_USE_RN_DEP || "1"
  };
}

function patchesFor(npmName) {
  const dir = path.join(mobileDir, "patches");
  if (!fs.existsSync(dir)) return "";
  const prefix = npmName.replace(/\//g, "+");
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".patch"))
    .sort()
    .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

function podVersions(pods) {
  const lockPath = path.join(iosDir, "Podfile.lock");
  if (!fs.existsSync(lockPath)) return "";
  const lock = fs.readFileSync(lockPath, "utf8");
  const podsSection = (lock.match(/^PODS:\n([\s\S]*?)\n\n[A-Z]/m) || [])[1] || "";
  return pods
    .map((pod) => {
      const match = podsSection.match(new RegExp(`^  - ${pod} \\(([^)]+)\\):`, "m"));
      return `${pod}:${match ? match[1] : "?"}`;
    })
    .join(",");
}

// The npm package's own podspec is what identifies the sources being replaced.
// The lockfile checksum cannot be used: it changes as soon as the pod is swapped
// for the prebuilt one, which would invalidate the artifact that caused the swap.
function podspecContent(npmName) {
  const dir = path.join(mobileDir, "node_modules", npmName);
  if (!fs.existsSync(dir)) return "";
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".podspec"))
    .sort()
    .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

function computeHash(npmName) {
  const lib = LIBRARIES[npmName];
  const state = rnPrebuiltState();
  const hash = crypto.createHash("sha1");
  hash.update(`lib:${npmName}@${libVersion(npmName)}\n`);
  hash.update(`pods:${lib.pod}\n`);
  hash.update(`podversions:${podVersions([lib.pod])}\n`);
  hash.update(`rn:${rnVersion()}\n`);
  hash.update(`xcode:${xcodeVersion()}\n`);
  hash.update(`rncore:${state.rncore}\n`);
  hash.update(`rndep:${state.rndep}\n`);
  hash.update(`archs:${SLICES.map((s) => s.archs.join("+")).join(",")}\n`);
  hash.update(`sim-excluded:none\n`);
  hash.update(`settings:${JSON.stringify(lib.buildSettings || {})}\n`);
  hash.update(`patch:${patchesFor(npmName)}\n`);
  hash.update(`podspec:${podspecContent(npmName)}\n`);
  return hash.digest("hex").substring(0, 8);
}

function artifactName(lib, config, hash) {
  return `${lib.pod}-${config}-${hash}.xcframework.zip`;
}

function isLfsPointer(file) {
  if (!fs.existsSync(file)) return false;
  if (fs.statSync(file).size >= 1000) return false;
  return fs.readFileSync(file, "utf8").startsWith("version https://git-lfs");
}

function isValidArtifact(file) {
  return fs.existsSync(file) && !isLfsPointer(file);
}

function buildSettingsFor(lib, config, slice) {
  const settings = Object.assign({}, lib.buildSettings || {});
  if (lib.swift) {
    settings.BUILD_LIBRARY_FOR_DISTRIBUTION = "YES";
    // NitroModules re-exports its own Objective-C++ module from Swift. Verifying
    // the emitted module interface in isolation cannot see that module and fails
    // with "underlying Objective-C module 'NitroModules' not found", even though
    // the interface itself is correct and is what create-xcframework needs.
    settings.OTHER_SWIFT_FLAGS = "$(inherited) -no-verify-emitted-module-interface";
  }
  // The Podfile excludes arm64 for the simulator, which would otherwise drop the
  // slice this script exists to produce. Overriding the unconditional setting is
  // enough to clear the conditional one as well.
  if (slice.sdk === "iphonesimulator") {
    settings.EXCLUDED_ARCHS = "";
    settings.ONLY_ACTIVE_ARCH = "NO";
  }
  return settings;
}

function build(npmName, config) {
  const lib = LIBRARIES[npmName];
  const pod = lib.pod;
  const hash = computeHash(npmName);
  const target = path.join(prebuiltDir, artifactName(lib, config, hash));

  if (isValidArtifact(target)) {
    console.log(`[SKIP] ${path.basename(target)} already exists`);
    return target;
  }

  fs.mkdirSync(prebuiltDir, { recursive: true });
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), `nn-ios-${pod}-`));
  const configuration = CONFIGURATIONS[config];
  const built = [];

  for (const slice of SLICES) {
    const derivedData = path.join(workDir, slice.sdk);
    const args = [
      "-workspace",
      "Notesnook.xcworkspace",
      "-scheme",
      pod,
      "-configuration",
      configuration.xcode,
      "-sdk",
      slice.sdk,
      ...slice.archs.map((arch) => `-arch=${arch}`),
      "-derivedDataPath",
      derivedData
    ];
    const settings = buildSettingsFor(lib, config, slice);
    for (const [key, value] of Object.entries(settings)) {
      args.push(`${key}=${value}`);
    }
    args.push("build");

    console.log(`[BUILD] ${pod} ${config} ${slice.sdk}/${slice.archs.join("+")}`);
    execFileSync("xcodebuild", args, { cwd: iosDir, stdio: "inherit" });

    const productsDir = path.join(derivedData, "Build", "Products");
    const productName = fs
      .readdirSync(productsDir)
      .find((d) => d.endsWith(`-${slice.sdk}`));
    const podProducts = path.join(productsDir, productName, pod);
    const staticLib = path.join(podProducts, `lib${pod}.a`);
    if (!fs.existsSync(staticLib)) {
      throw new Error(`No static library for ${pod} at ${staticLib}`);
    }
    built.push({ slice, staticLib, podProducts });
  }

  const publicHeaders = path.join(iosDir, "Pods", "Headers", "Public", pod);

  const outDir = path.join(workDir, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const xcframework = path.join(outDir, `${pod}.xcframework`);
  const xcfArgs = [];
  for (const { slice, staticLib, podProducts } of built) {
    const headersDir = path.join(workDir, "headers", `${slice.sdk}-${slice.archs.join("_")}`);
    fs.mkdirSync(headersDir, { recursive: true });
    if (fs.existsSync(publicHeaders)) {
      execFileSync("cp", ["-R", `${publicHeaders}/.`, headersDir]);
    }
    if (lib.swift) {
      const swiftmodule = path.join(podProducts, `${pod}.swiftmodule`);
      if (fs.existsSync(swiftmodule)) {
        execFileSync("cp", ["-R", swiftmodule, path.join(headersDir, `${pod}.swiftmodule`)]);
      }
    }
    xcfArgs.push("-library", staticLib, "-headers", headersDir);
  }
  execFileSync("xcodebuild", ["-create-xcframework", ...xcfArgs, "-output", xcframework], {
    stdio: "inherit"
  });

  execFileSync("zip", ["-qry", target, `${pod}.xcframework`], { cwd: outDir });
  fs.rmSync(workDir, { recursive: true, force: true });
  console.log(`[BUILT] ${target}`);
  return target;
}

function listArtifacts() {
  const result = {};
  for (const npmName of Object.keys(LIBRARIES)) {
    const lib = LIBRARIES[npmName];
    try {
      const hash = computeHash(npmName);
      const configs = {};
      for (const config of Object.keys(CONFIGURATIONS)) {
        const file = path.join(prebuiltDir, artifactName(lib, config, hash));
        if (isValidArtifact(file)) configs[config] = file;
      }
      if (Object.keys(configs).length > 0) result[lib.pod] = configs;
    } catch (e) {}
  }
  return result;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === "--list") {
    process.stdout.write(JSON.stringify(listArtifacts()) + "\n");
    process.exit(0);
  }

  const targetLib = args[0];
  const targetConfig = args[1];
  const libs = targetLib ? [targetLib] : Object.keys(LIBRARIES);
  for (const npmName of libs) {
    if (!LIBRARIES[npmName]) throw new Error(`Unknown library: ${npmName}`);
    const configs = targetConfig ? [targetConfig] : DEFAULT_CONFIGURATIONS;
    for (const config of configs) {
      if (!CONFIGURATIONS[config]) throw new Error(`Unknown configuration: ${config}`);
      build(npmName, config);
    }
  }
}

module.exports = { computeHash, listArtifacts, LIBRARIES, artifactName, prebuiltDir, cacheDir };
