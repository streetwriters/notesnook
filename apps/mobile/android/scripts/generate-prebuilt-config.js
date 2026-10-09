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

const scriptsDir = __dirname;
const androidDir = path.resolve(scriptsDir, "..");
const mobileDir = path.resolve(androidDir, "..");
const outputFile = path.join(androidDir, "prebuilt-libraries.json");

// Known custom properties or manual flags
const KNOWN_OVERRIDES = {
  "react-native-quick-sqlite": {
    customFlagsProp: "quickSqliteFlags"
  },
  "react-native-screens": {
    transitive: ["androidx.lifecycle:lifecycle-viewmodel-ktx:2.5.1"]
  },
  "react-native-gesture-handler": {
    transitive: ["androidx.core:core-ktx:1.8.0"]
  }
};

// Dependency ordering: key must be built after dependency
const DEPENDENCIES = {
  "react-native-nitro-cloud-uploader": ["react-native-nitro-modules"],
  "react-native-reanimated": ["react-native-worklets"]
};

// Libraries excluded from active AAR prebuilding (e.g. built differently or experimental)
const EXCLUDE_FROM_ACTIVE = new Set(["@callstack/repack"]);

function extractTransitiveDeps(gradleFilePath) {
  if (!fs.existsSync(gradleFilePath)) return [];
  const content = fs.readFileSync(gradleFilePath, "utf8");
  const deps = [];
  const regex = /(?:implementation|api|compile)\s+['"]([^:'"]+:[^:'"]+:[^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const dep = match[1].trim();
    // Exclude react-native / fbjni / dynamic variables like $kotlin_version
    if (
      !dep.startsWith("com.facebook.react:") &&
      !dep.startsWith("com.facebook.fbjni:") &&
      !dep.includes("$") &&
      !dep.includes("@aar")
    ) {
      deps.push(dep);
    }
  }
  return [...new Set(deps)];
}

function hasCppNativeBuild(depAndroidDir) {
  const cmakePath = path.join(depAndroidDir, "CMakeLists.txt");
  if (fs.existsSync(cmakePath)) return true;

  const gradleFile = path.join(depAndroidDir, "build.gradle");
  if (fs.existsSync(gradleFile)) {
    const content = fs.readFileSync(gradleFile, "utf8");
    if (content.includes("externalNativeBuild") || content.includes("cmake {")) {
      return true;
    }
  }
  return false;
}

function generateConfig() {
  const pkgJsonPath = path.join(mobileDir, "package.json");
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const allDeps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies
  };

  // Preserve existing user customizations if present
  let existingConfig = {};
  if (fs.existsSync(outputFile)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(outputFile, "utf8"));
    } catch (e) {}
  }

  const libraries = {};

  for (const depName of Object.keys(allDeps)) {
    const depDir = path.join(mobileDir, "node_modules", depName);
    const depAndroidDir = path.join(depDir, "android");
    if (!fs.existsSync(depAndroidDir)) continue;

    // Only target libraries with actual C++ native build
    if (!hasCppNativeBuild(depAndroidDir)) continue;

    const gradleProject = depName.replace(/^@/, "").replace(/\//g, "_");
    const filePrefix = depName.replace(/^@/, "").replace(/\//g, "-");
    const gradleFile = path.join(depAndroidDir, "build.gradle");
    const extractedTransitive = extractTransitiveDeps(gradleFile);

    // Merge with known manual overrides and existing config
    const overrides = KNOWN_OVERRIDES[depName] || {};
    const existing = (existingConfig.libraries && existingConfig.libraries[depName]) || {};

    const transitive = Array.from(
      new Set([
        ...extractedTransitive,
        ...(overrides.transitive || []),
        ...(existing.transitive || [])
      ])
    );

    const libEntry = {
      gradleProject: existing.gradleProject || overrides.gradleProject || gradleProject,
      filePrefix: existing.filePrefix || overrides.filePrefix || filePrefix,
      hasCpp: true,
      transitive
    };

    if (overrides.customFlagsProp || existing.customFlagsProp) {
      libEntry.customFlagsProp = overrides.customFlagsProp || existing.customFlagsProp;
    }

    libraries[depName] = libEntry;
  }

  // Active libraries: all detected C++ libraries except EXCLUDE_FROM_ACTIVE
  let activeLibraries = existingConfig.activeLibraries;
  if (!Array.isArray(activeLibraries) || activeLibraries.length === 0) {
    activeLibraries = Object.keys(libraries).filter((name) => !EXCLUDE_FROM_ACTIVE.has(name));
  } else {
    // Filter to only libraries that actually exist in the detected set
    activeLibraries = activeLibraries.filter((name) => libraries[name]);
  }

  // Topological sorting for dependencies (e.g., nitro-modules before nitro-cloud-uploader)
  activeLibraries.sort((a, b) => {
    if (DEPENDENCIES[b]?.includes(a)) return -1;
    if (DEPENDENCIES[a]?.includes(b)) return 1;
    return 0;
  });

  const finalConfig = {
    libraries,
    activeLibraries
  };

  fs.writeFileSync(outputFile, JSON.stringify(finalConfig, null, 2) + "\n");
  console.log(`[CONFIG] Generated ${outputFile}`);
  console.log(`[CONFIG] Detected C++ libraries: ${Object.keys(libraries).length}`);
  console.log(`[CONFIG] Active prebuilt libraries: ${activeLibraries.length} (${activeLibraries.join(", ")})`);
  return finalConfig;
}

if (require.main === module) {
  generateConfig();
}

module.exports = {
  generateConfig
};
