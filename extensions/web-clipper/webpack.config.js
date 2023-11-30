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
const webpack = require("webpack");
const path = require("path");
const fileSystem = require("fs-extra");
const env = require("./build-utils/env");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { v2, v3 } = require("./build-utils/manifest");

const ASSET_PATH = process.env.ASSET_PATH || "./public";
const MANIFEST_VERSION = process.env.MANIFEST_VERSION || "2";

var alias = {
  react: path.resolve(path.join(__dirname, "node_modules", "react")),
  "@emotion/react": path.resolve(
    path.join(__dirname, "node_modules", "@emotion", "react")
  )
};

// load the secrets
var secretsPath = path.join(__dirname, "secrets." + env.NODE_ENV + ".js");

var fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2"
];

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

var options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    //  newtab: path.join(__dirname, "src", "pages", "Newtab", "index.jsx"),
    //  options: path.join(__dirname, "src", "options.tsx"),
    popup: path.join(__dirname, "src", "index.tsx"),
    background: path.join(__dirname, "src", "background.ts"),
    contentScript: path.join(__dirname, "src", "content-scripts", "all.ts"),
    nnContentScript: path.join(__dirname, "src", "content-scripts", "nn.ts")
    // mobile: path.join(__dirname, "src", "views", "Mobile", "index.ts"),
    // index: path.join(__dirname, "src", "index.ts")
    //  devtools: path.join(__dirname, "src", "pages", "Devtools", "index.js"),
    /// panel: path.join(__dirname, "src", "pages", "Panel", "index.jsx"),
  },
  chromeExtensionBoilerplate: {
    //  notHotReload: ["contentScript", "devtools"],
    notHotReload: ["nnContentScript", "contentScript", "background"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].bundle.js",
    clean: true,
    publicPath: ASSET_PATH
  },
  module: {
    rules: [
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        // in the `src` directory
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        loader: "file-loader",
        options: {
          name: "[name].[ext]"
        },
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      },
      { test: /\.(ts|tsx)$/, loader: "ts-loader", exclude: /node_modules/ },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: "source-map-loader"
          },
          {
            loader: "babel-loader"
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map((extension) => "." + extension)
      .concat([".js", ".jsx", ".ts", ".tsx", ".css"])
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: false,
      dangerouslyAllowCleanPatternsOutsideProject: true
    }),
    new webpack.ProgressPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/manifest.json",
          to: path.join(__dirname, "build"),
          force: true,
          transform: function () {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify(MANIFEST_VERSION === "2" ? v2 : v3)
            );
          }
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/index.css",
          to: path.join(__dirname, "build"),
          force: true
        }
      ]
    }),
    // new HtmlWebpackPlugin({
    //   template: path.join(__dirname, "src", "pages", "Newtab", "index.html"),
    //   filename: "newtab.html",
    //   chunks: ["newtab"],
    //   cache: false,
    // }),
    // new HtmlWebpackPlugin({
    //   template: path.join(__dirname, "src", "pages", "Options", "index.html"),
    //   filename: "options.html",
    //   chunks: ["options"],
    //   cache: false,
    // }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public", "index.html"),
      filename: "popup.html",
      chunks: ["popup"],
      cache: false
    })
    // new HtmlWebpackPlugin({
    //   template: path.join(
    //     __dirname,
    //     "src",
    //     "views",
    //     "Background",
    //     "index.html"
    //   ),
    //   filename: "background.html",
    //   chunks: ["background"],
    //   cache: false,
    // }),
    // new HtmlWebpackPlugin({
    //   template: path.join(__dirname, "src", "pages", "Devtools", "index.html"),
    //   filename: "devtools.html",
    //   chunks: ["devtools"],
    //   cache: false,
    // }),
    // new HtmlWebpackPlugin({
    //   template: path.join(__dirname, "src", "pages", "Panel", "index.html"),
    //   filename: "panel.html",
    //   chunks: ["panel"],
    //   cache: false,
    // }),
  ],
  infrastructureLogging: {
    level: "info"
  }
};

if (env.NODE_ENV === "development") {
  options.devtool = "cheap-module-source-map";
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
    ]
  };
}

module.exports = options;
