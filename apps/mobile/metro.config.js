const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const {
  wrapWithReanimatedMetroConfig
} = require("react-native-reanimated/metro-config");

/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
const nodeModulesPaths = [path.resolve(path.join(__dirname, "node_modules"))];
const config = {
  projectRoot: __dirname,
  watchFolders: [path.join(__dirname, "../../packages")]
};
const mergedConfig = mergeConfig(getDefaultConfig(__dirname), config);

mergedConfig.resolver = {
  sourceExts: ["jsx", "js", "ts", "tsx", "cjs", "json"],
  nodeModulesPaths,
  extraNodeModules: {
    react: path.join(__dirname, "node_modules/react"),
    "react-dom": path.join(__dirname, "node_modules/react-dom"),
    "@notesnook": path.join(__dirname, "../../packages"),
    "@notifee/react-native": path.join(
      __dirname,
      "node_modules/@ammarahmed/notifee-react-native"
    )
  },
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === "react-dom") {
      return {
        type: "empty"
      };
    }
    if (moduleName === "node:crypto") {
      return {
        type: "empty"
      };
    }

    if (moduleName.includes("zustand")) {
      const result = require.resolve(moduleName); // gets CommonJS version
      return context.resolveRequest(context, result, platform);
    }

    if (moduleName === "crypto") {
      return {
        type: "empty"
      };
    }

    if (moduleName === "react/jsx-runtime") {
      return {
        filePath: path.resolve(
          path.join(__dirname, "node_modules", "react", "jsx-runtime.js")
        ),
        type: "sourceFile"
      };
    }

    if (moduleName === "react") {
      // Resolve react package from mobile app's node_modules folder always.
      return {
        filePath: path.resolve(
          path.join(__dirname, "node_modules", "react", "index.js")
        ),
        type: "sourceFile"
      };
    }

    if (moduleName === "@streetwriters/kysely") {
      // Resolve react package from mobile app's node_modules folder always.
      return {
        filePath: path.resolve(
          path.join(
            __dirname,
            "node_modules",
            "@streetwriters",
            "kysely",
            "dist",
            "cjs",
            "index.js"
          )
        ),
        type: "sourceFile"
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  }
};

module.exports = wrapWithReanimatedMetroConfig(mergedConfig);
