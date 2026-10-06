const fs = require("fs");
const path = require("path");
const { computeHash, ALL_LIBRARIES } = require("./android/scripts/build-prebuilt-aars");

const isGithubRelease = false;
const config = {
  commands: require("@callstack/repack/commands/rspack")
};

if (!config.dependencies) config.dependencies = {};

const isBuildingPrebuilt = process.env.BUILDING_PREBUILT_AARS === "true";
const disabledMarker = path.join(__dirname, "android", "build", "generated", "autolinking", ".prebuilt-disabled");
const isPrebuiltDisabled = fs.existsSync(disabledMarker) || process.env.USE_PREBUILT_AARS === "false";
const prebuiltDir = path.join(__dirname, "android", ".prebuilt-aars");

function hasPrebuiltAars(libName) {
  if (!fs.existsSync(prebuiltDir)) return false;
  try {
    const hash = computeHash(libName);
    const libConfig = ALL_LIBRARIES[libName] || { filePrefix: libName.replace(/^@/, "").replace(/\//g, "-") };
    const debugAar = path.join(prebuiltDir, `${libConfig.filePrefix}-debug-${hash}.aar`);
    const releaseAar = path.join(prebuiltDir, `${libConfig.filePrefix}-release-${hash}.aar`);
    return fs.existsSync(debugAar) && fs.existsSync(releaseAar);
  } catch (e) {
    return false;
  }
}

// Configured prebuilt libraries to check
const CONFIGURED_PREBUILT_LIBS = [
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

if (!isBuildingPrebuilt && !isPrebuiltDisabled) {
  for (const lib of CONFIGURED_PREBUILT_LIBS) {
    if (hasPrebuiltAars(lib)) {
      config.dependencies[lib] = {
        ...(config.dependencies[lib] || {}),
        platforms: {
          ...((config.dependencies[lib] && config.dependencies[lib].platforms) || {}),
          android: null
        }
      };
    }
  }
}

config.dependencies["react-native-vector-icons"] = {
  platforms: {
    ios: null
  }
};

if (isGithubRelease) {
  config.dependencies["react-native-iap"] = {
    platforms: {
      android: null
    }
  };
  config.dependencies["react-native-in-app-review"] = {
    platforms: {
      android: null
    }
  };
}

module.exports = config;
