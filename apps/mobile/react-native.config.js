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
const { findPrebuiltAars } = require("./android/scripts/build-prebuilt-aars");

const isGithubRelease = false;
const config = {
  commands: require("@callstack/repack/commands/rspack")
};

if (!config.dependencies) config.dependencies = {};

const prebuiltState = path.join(
  __dirname,
  "android",
  "build",
  "generated",
  "autolinking",
  ".prebuilt-aars.state"
);
const isPrebuiltDisabled =
  process.env.BUILDING_PREBUILT_AARS === "true" ||
  process.env.USE_PREBUILT_AARS === "false" ||
  (fs.existsSync(prebuiltState) &&
    fs.readFileSync(prebuiltState, "utf8") === "disabled");

if (!isPrebuiltDisabled) {
  for (const lib of Object.keys(findPrebuiltAars())) {
    config.dependencies[lib] = {
      platforms: {
        android: {
          dependencyConfiguration: "prebuiltAar"
        }
      }
    };
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
