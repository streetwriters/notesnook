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

const path = require("path");

const buildRoot = process.env.NN_BUILD_ROOT || ".";
const buildFiles = [
  `${buildRoot}/build/`,
  `!${buildRoot}/build/screenshots\${/*}`,
  `!${buildRoot}/build/banner.jpg`,
  `!${buildRoot}/build/*.ico`,
  `!${buildRoot}/build/*.png`
];

const productName = process.env.NN_PRODUCT_NAME || "Notesnook";
const appId = process.env.NN_APP_ID || "org.streetwriters.notesnook";
const outputDir = process.env.NN_OUTPUT_DIR || "output";
const linuxExecutableName = process.env.NN_PRODUCT_NAME
  ? process.env.NN_PRODUCT_NAME.toLowerCase().replace(/\s+/g, "-")
  : "notesnook";
const year = new Date().getFullYear();

module.exports = {
  appId: appId,
  productName: productName,
  copyright: `Copyright © ${year} Streetwriters (Private) Limited`,
  artifactName: "notesnook_${os}_${arch}.${ext}",
  generateUpdatesFilesForAllChannels: true,
  asar: false,
  files: [
    "!*.chunk.js.map",
    "!*.chunk.js.LICENSE.txt",
    ...buildFiles,
    "!node_modules${/*}",
    "node_modules/better-sqlite3-multiple-ciphers/build/Release/better_sqlite3.node",
    "node_modules/better-sqlite3-multiple-ciphers/lib",
    "node_modules/better-sqlite3-multiple-ciphers/package.json",
    "node_modules/file-uri-to-path",
    "node_modules/bindings",
    "node_modules/node-gyp-build",
    "node_modules/sqlite-better-trigram",
    "node_modules/sodium-native/prebuilds/${platform}-${arch}",
    {
      from: "node_modules/sqlite-better-trigram-linux-${arch}",
      to: "node_modules/sqlite-better-trigram-linux-${arch}"
    },
    {
      from: "node_modules/sqlite-better-trigram-darwin-${arch}",
      to: "node_modules/sqlite-better-trigram-darwin-${arch}"
    },
    {
      from: "node_modules/sqlite-better-trigram-windows-${arch}",
      to: "node_modules/sqlite-better-trigram-windows-${arch}"
    },
    "node_modules/sodium-native/index.js",
    "node_modules/sodium-native/package.json"
  ],
  afterPack: "./scripts/removeLocales.js",
  mac: {
    bundleVersion: "240",
    minimumSystemVersion: "10.12.0",
    target: [
      {
        target: "dmg",
        arch: ["arm64", "x64"]
      },
      {
        target: "zip",
        arch: ["arm64", "x64"]
      }
    ],
    category: "public.app-category.productivity",
    darkModeSupport: true,
    type: "distribution",
    hardenedRuntime: true,
    entitlements: "assets/entitlements.mac.plist",
    entitlementsInherit: "assets/entitlements.mac.plist",
    gatekeeperAssess: false,
    icon: "assets/icons/app.icns",
    notarize: true
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: "link",
        path: "/Applications"
      }
    ],
    icon: "assets/icons/app.icns",
    title: "Install Notesnook"
  },
  mas: {
    entitlements: "assets/entitlements.mas.plist",
    entitlementsInherit: "assets/entitlements.mas.inherit.plist",
    entitlementsLoginHelper: "assets/entitlements.mas.loginhelper.plist",
    hardenedRuntime: true
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64", "arm64"]
      },
      {
        target: "portable",
        arch: ["x64", "arm64"]
      }
    ],
    signtoolOptions: {
      signingHashAlgorithms: ["sha256"],
      sign: "./scripts/sign.js"
    },
    icon: "assets/icons/app.ico"
  },
  portable: {
    artifactName: "notesnook_${os}_${arch}_portable.${ext}"
  },
  nsis: {
    oneClick: true,
    createDesktopShortcut: "always",
    deleteAppDataOnUninstall: true
  },
  linux: {
    target: [
      {
        target: "AppImage",
        arch: ["x64", "arm64"]
      },
      {
        target: "snap",
        arch: ["x64", "arm64"]
      }
    ],
    category: "Office",
    icon: "assets/icons/app.icns",
    description: "Your private note taking space",
    executableName: linuxExecutableName,
    desktop: {
      actions: [
        {
          id: "new-note",
          name: "New note",
          args: "new note"
        },
        {
          id: "new-notebook",
          name: "New notebook",
          args: "new notebook"
        },
        {
          id: "new-reminder",
          name: "New reminder",
          args: "new reminder"
        }
      ]
    }
  },
  snap: {
    autoStart: false,
    confinement: "strict",
    allowNativeWayland: true
  },
  extraResources: ["app-update.yml", "./assets/**"],
  extraMetadata: {
    main: path.join(buildRoot, "build", "electron.js")
  },
  directories: {
    buildResources: "assets",
    output: outputDir
  },
  publish: [
    {
      provider: "github",
      repo: "notesnook",
      owner: "streetwriters"
    }
  ]
};
