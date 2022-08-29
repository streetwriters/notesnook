/* eslint-disable @typescript-eslint/no-var-requires */

const { execSync } = require("child_process");
const { readFileSync } = require("fs");

const authorEmail = execSync(`git config --global --get user.email`)
  .toString("utf-8")
  .trim();
const authors = readFileSync("AUTHORS", "utf-8");
const isAuthor = authors.includes(`<${authorEmail}>`);

const SCOPES = [
  // apps
  "mobile",
  "web",

  // packages
  "crypto",
  "crypto-worker",
  "editor",
  "logger",
  "streamable-fs",

  // repo maintenance
  "config", // changing configuration of already installed tools in the repo
  "ci", // changes related to CI
  "setup", // setting up someting new in the repo (e.g. eslint, commitlint)
  "docs" // changes related to documentation (README etc.)
];

module.exports = {
  rules: {
    "signed-off-by": [isAuthor ? 0 : 2, "always", `Signed-off-by:`],
    "type-enum": [2, "always", SCOPES],
    "type-empty": [2, "never"]
  }
};
