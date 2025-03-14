/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const Repack = require("@callstack/repack");
const { ReanimatedPlugin } = require('@callstack/repack-plugin-reanimated');
const { NormalModuleReplacementPlugin, default: rspack } = require("@rspack/core");
const { getModulePaths } = require('@callstack/repack');
/**
 * More documentation, installation, usage, motivation and differences with Metro is available at:
 * https://github.com/callstack/repack/blob/main/README.md
 *
 * The API documentation for the functions and plugins used in this file is available at:
 * https://re-pack.netlify.app/
 */

/**
 * Webpack configuration.
 * You can also export a static object or a function returning a Promise.
 *
 * @param env Environment options passed from either Webpack CLI or React Native CLI
 *            when running with `react-native start/bundle`.
 * 
 * @returns {import("@rspack/core").RspackOptions}
 */
module.exports = (env) => {
  const {
    mode = "development",
    context = __dirname,
    entry = "./index.js",
    platform = process.env.PLATFORM,
    minimize = mode === "production",
    reactNativePath = path.join(__dirname, "../node_modules/react-native"),
  } = env;

  if (!platform) {
    throw new Error("Missing platform");
  }

  /**
   * Depending on your Babel configuration you might want to keep it.
   * If you don't use `env` in your Babel config, you can remove it.
   *
   * Keep in mind that if you remove it you should set `BABEL_ENV` or `NODE_ENV`
   * to `development` or `production`. Otherwise your production code might be compiled with
   * in development mode by Babel.
   */
  process.env.BABEL_ENV = mode;

  return {
    mode,
    cache: true,
    experiments: {
      parallelCodeSplitting: true,
      cache: {
        type: "persistent",
        buildDependencies: [__filename, path.join(__dirname, "..", "package-lock.json"), path.join(__dirname, "..", "scripts","optimize-fonts.mjs")],
      },
    },
    /**
     * This should be always `false`, since the Source Map configuration is done
     * by `SourceMapDevToolPlugin`.
     */
    devtool: 'source-map',
    context,
    /**
     * `getInitializationEntries` will return necessary entries with setup and initialization code.
     * If you don't want to use Hot Module Replacement, set `hmr` option to `false`. By default,
     * HMR will be enabled in development mode.
     */
    entry: entry,
    resolve: {
      /**
       * `getResolveOptions` returns additional resolution configuration for React Native.
       * If it's removed, you won't be able to use `<file>.<platform>.<ext>` (eg: `file.ios.js`)
       * convention and some 3rd-party libraries that specify `react-native` field
       * in their `package.json` might not work correctly.
       */
      ...Repack.getResolveOptions(platform),

      /**
       * Uncomment this to ensure all `react-native*` imports will resolve to the same React Native
       * dependency. You might need it when using workspaces/monorepos or unconventional project
       * structure. For simple/typical project you won't need it.
       */
      alias: {
        'react-native': reactNativePath,
        "react": path.join(__dirname, "../node_modules/react"),
        "react-dom": path.join(__dirname, "../node_modules/react-dom"),
        "@notesnook": path.join(__dirname, "../../../packages"),
        "@notesnook/core": path.join(__dirname, "../../../packages/core"),
        "@streetwriters/showdown": path.join(__dirname, "../node_modules/@streetwriters/showdown"),
        "qclone": path.join(__dirname, "../node_modules/qclone"),
        "@notifee/react-native": path.join(__dirname, "../node_modules/@ammarahmed/notifee-react-native"),
        "html-to-text": path.join(__dirname, "../node_modules/html-to-text"),
        "leac": path.join(__dirname, "../node_modules/leac"),
        "parseley": path.join(__dirname, "../node_modules/parseley"),
        "htmlparser2": path.join(__dirname, "../node_modules/htmlparser2"),
        "selderee": path.join(__dirname, "../node_modules/selderee"),
        "minimist": path.join(__dirname, "../node_modules/minimist"),
        "entities": path.join(__dirname, "../node_modules/entities"),
        "deepmerge": path.join(__dirname, "../node_modules/deepmerge"),
        "@selderee/plugin-htmlparser2": path.join(__dirname, "../node_modules/@selderee/plugin-htmlparser2"),
        "peberminta": path.join(__dirname, "../node_modules/peberminta"),
        "react-native-blob-util": path.join(__dirname, "../node_modules/react-native-blob-util"),
        "@mdi/js": path.join(__dirname, "../node_modules/@mdi/js/mdi.js"),
        "katex": path.join(__dirname, "../node_modules/katex"),
        "tinycolor2": path.join(__dirname, "../node_modules/tinycolor2"),
        "@lingui/core": path.join(__dirname, "../node_modules/@lingui/core"),
        "@swc/helpers": path.join(__dirname, "../node_modules/@swc/helpers"),
        "@messageformat/parser": path.join(__dirname, "../node_modules/@messageformat/parser/lib/parser.js"),
      },
      fallback: {
        "crypto": false,
      },
    },
    /**
     * Configures output.
     * It's recommended to leave it as it is unless you know what you're doing.
     * By default Webpack will emit files into the directory specified under `path`. In order for the
     * React Native app use them when bundling the `.ipa`/`.apk`, they need to be copied over with
     * `Repack.OutputPlugin`, which is configured by default inside `Repack.RepackPlugin`.
     */
    output: {
      clean: true,
      hashFunction: 'xxhash64',
      path: path.join(__dirname, 'build/generated', platform),
      filename: "index.bundle",
      chunkFilename: "[name].chunk.bundle",
    },

    module: {
      /**
       * This rule will process all React Native related dependencies with Babel.
       * If you have a 3rd-party dependency that you need to transpile, you can add it to the
       * `include` list.
       *
       * You can also enable persistent caching with `cacheDirectory` - please refer to:
       * https://github.com/babel/babel-loader#options
       */
      rules: [
        ...Repack.getJsTransformRules(),
        ...Repack.getAssetTransformRules(),
        {
          test: /\.jsx?$/,
          type: 'javascript/auto',
          include: getModulePaths([
            '@react-native-masked-view/masked-view',
            "react-native-tooltips",
            "react-native-keyboard-aware-scroll-view",
            "react-native-keychain",
            "react-native-datetime-picker",
            "react-native-modal-datetime-picker"
          ]),
          use: {
            loader: '@callstack/repack/flow-loader',
            options: { all: true },
          },
        },
        {
          test: /\.mjs$|cjs$|js$|jsx$|ts$|tsx$/,
          include: (value) => {
            if (value.includes("packages/intl") || value.includes("messageformat")) {
               return true;
            }
            return false;
          },
          use: {
            loader: "babel-loader",
            options: {
              configFile: false,
              babelrc: false,
              plugins: [
                "@babel/plugin-transform-unicode-property-regex",
              ]
            },
          },
        },
    

        /**
         * This loader handles all static assets (images, video, audio and others), so that you can
         * use (reference) them inside your application.
         *
         * If you wan to handle specific asset type manually, filter out the extension
         * from `ASSET_EXTENSIONS`, for example:
         * ```
         * Repack.ASSET_EXTENSIONS.filter((ext) => ext !== 'svg')
         * ```
         */
        {
          test: Repack.getAssetExtensionsRegExp(
            Repack.ASSET_EXTENSIONS.filter((ext) => ext !== "svg")
          ),
          use: {
            loader: "@callstack/repack/assets-loader",
          },
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                native: true,
                dimensions: false,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new NormalModuleReplacementPlugin(
        /node:crypto/,
        (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      ),
      new ReanimatedPlugin(),
      /**
       * Configure other required and additional plugins to make the bundle
       * work in React Native and provide good development experience with
       * sensible defaults.
       *
       * `Repack.RepackPlugin` provides some degree of customization, but if you
       * need more control, you can replace `Repack.RepackPlugin` with plugins
       * from `Repack.plugins`.
       */
      new Repack.RepackPlugin({
        logger: {
          console: false,
          listener: (e => {
            if (e.message[0].includes("Bundle built with warnings")) {
              console.warn(`ℹ ` + e.message[0] + " time: " + e.message[1].time);
              return;
            }
          })
          
        },
        extraChunks: [
          {
            type: "local",
            include: /.*/,
          },
        ],
      }),
    ],
  }
}
