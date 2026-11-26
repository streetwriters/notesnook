const fs = require("fs");
const path = require("path");
const { mergeConfig } = require("@react-native/metro-config");
const { makeMetroConfig } = require("@react-native-gpui/core/metro.config");

const base = makeMetroConfig({ projectRoot: __dirname });
const packagesDir = path.resolve(__dirname, "../../packages");
const target = path.join(__dirname, "src/targets/desktop");
const uiKit = path.resolve(packagesDir, "ui/src/kit");
// `@notesnook/ui-kit` is the active target's kit; its subpaths
// (`@notesnook/ui-kit/desktop/...`, `/shared/...`) are files in the kit.
const targetAliases = {
  "@platform": path.join(target, "platform"),
  "@notesnook/ui-kit": uiKit
};
const exactAliases = {
  "@notesnook/ui-kit": path.join(target, "ui")
};

const pdfModuleRoot = path.dirname(
  require.resolve("@react-native-gpui/pdf/package.json")
);
const linkedModulesNodeModules = path.resolve(
  pdfModuleRoot,
  "../../node_modules"
);

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
  "@streetwriters/kysely",
  "@zip.js/zip.js"
]);

const config = mergeConfig(base, {
  watchFolders: [...base.watchFolders, packagesDir],
  resolver: {
    resolverMainFields: ["react-native", "browser", "main"],
    sourceExts: [...base.resolver.sourceExts, "cjs"],
    nodeModulesPaths: [
      ...base.resolver.nodeModulesPaths,
      ...packageNodeModules,
      linkedModulesNodeModules
    ],
    resolveRequest: (context, moduleName, platform) => {
      if (
        moduleName === "react-dom" ||
        moduleName === "crypto" ||
        moduleName === "node:crypto"
      ) {
        return { type: "empty" };
      }
      if (
        context.originModulePath.startsWith(uiKit + path.sep) &&
        !moduleName.startsWith(".") &&
        !moduleName.startsWith("/") &&
        !moduleName.startsWith("@platform") &&
        !moduleName.startsWith("@notesnook/ui-kit")
      ) {
        context = {
          ...context,
          originModulePath: path.join(__dirname, "index.js")
        };
      }
      if (Object.hasOwn(exactAliases, moduleName)) {
        return context.resolveRequest(
          context,
          exactAliases[moduleName],
          platform
        );
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

module.exports = require("@react-native-gpui/pdf/metro.cjs")(config);
