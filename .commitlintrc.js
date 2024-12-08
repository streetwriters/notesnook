/* eslint-disable @typescript-eslint/no-var-requires */

const { execSync } = require("child_process");
const { readFileSync } = require("fs");

const authorEmail = execSync(`git config --global --get user.email`)
  .toString("utf-8")
  .trim();
const authors = readFileSync("AUTHORS", "utf-8");
const isAuthor = authors.includes(`<${authorEmail}>`);

const SCOPES = [
  // for full list of scopes + details see: https://github.com/streetwriters/notesnook/blob/master/CONTRIBUTING.md#commit-guidelines

  "mobile",
  "web",
  "vericrypt",
  "monograph",
  "desktop",
  "crypto",
  "editor",
  "logger",
  "theme",
  "server",
  "core",
  "fs",
  "ui",
  "clipper",
  "config",
  "ci",
  "setup",
  "docs",
  "refactor",
  "misc",
  "common",
  "global",
  "docs",
  "themebuilder",
  "intl",
  "webclipper"
];

module.exports = {
  rules: {
    "signed-off-by": [isAuthor ? 0 : 2, "always", `Signed-off-by:`],
    "type-enum": [2, "always", SCOPES],
    "type-empty": [2, "never"]
  }
};
