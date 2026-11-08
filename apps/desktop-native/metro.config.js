const fs = require("fs");
const path = require("path");
const { mergeConfig } = require("@react-native/metro-config");
const { makeMetroConfig } = require("@react-native-gpui/core/metro.config");

const base = makeMetroConfig({ projectRoot: __dirname });
const packagesDir = path.resolve(__dirname, "../../packages");
const target = path.join(__dirname, "src/targets/desktop");
const targetAliases = {
  "@ui": path.join(target, "ui"),
  "@platform": path.join(target, "platform")
};

const packageNodeModules = fs
  .readdirSync(packagesDir)
  .map((name) => path.join(packagesDir, name, "node_modules"))
  .filter((dir) => fs.existsSync(dir));

const CJS_PACKAGES = new Set([
  "@tanstack/query-core",
  "@notesnook/core",
  "@notesnook/common",
  "@notesnook/logger",
  "@notesnook/theme",
  "@notesnook/intl",
  "@streetwriters/kysely"
]);

module.exports = mergeConfig(base, {
  watchFolders: [...base.watchFolders, packagesDir],
  resolver: {
    resolverMainFields: ["react-native", "browser", "main"],
    sourceExts: [...base.resolver.sourceExts, "cjs"],
    nodeModulesPaths: [
      ...base.resolver.nodeModulesPaths,
      ...packageNodeModules
    ],
    resolveRequest: (context, moduleName, platform) => {
      if (
        moduleName === "react-dom" ||
        moduleName === "crypto" ||
        moduleName === "node:crypto"
      ) {
        return { type: "empty" };
      }
      for (const [alias, dir] of Object.entries(targetAliases)) {
        if (moduleName === alias || moduleName.startsWith(alias + "/")) {
          return context.resolveRequest(
            context,
            path.join(dir, moduleName.slice(alias.length)),
            platform
          );
        }
      }
      if (CJS_PACKAGES.has(moduleName) || moduleName.includes("zustand")) {
        return context.resolveRequest(
          context,
          require.resolve(moduleName),
          platform
        );
      }
      if (moduleName === "react" || moduleName === "react/jsx-runtime") {
        return {
          type: "sourceFile",
          filePath: path.resolve(
            __dirname,
            "node_modules",
            moduleName === "react" ? "react/index.js" : "react/jsx-runtime.js"
          )
        };
      }
      return (base.resolver.resolveRequest ?? context.resolveRequest)(
        context,
        moduleName,
        platform
      );
    }
  }
});
