import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "path";

export default defineConfig({
  html: {
    template: "./public/index.html"
  },
  output: {
    distPath: {
      root: "build"
    },
    sourceMap: {
      css: false,
      js: "cheap-module-source-map"
    }
  },

  tools: {
    rspack: {
      externals: {
        "node:crypto": "commonjs crypto"
      },
      resolve: {
        alias: {
          react: path.resolve(path.join(__dirname, "node_modules", "react")),
          "react-dom": path.resolve(
            path.join(__dirname, "node_modules", "react-dom")
          ),
          "@mdi/js": path.resolve(
            path.join(__dirname, "node_modules", "@mdi/js")
          ),
          "@mdi/react": path.resolve(
            path.join(__dirname, "node_modules", "@mdi/react")
          ),
          "@emotion/react": path.resolve(
            path.join(__dirname, "node_modules", "@emotion/react")
          )
        },
        fallback: {
          crypto: false,
          module: false,
          dgram: false,
          path: false,
          url: false,
          fs: false
        }
      }
    }
  },
  plugins: [pluginReact()]
});
