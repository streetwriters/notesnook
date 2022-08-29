/* eslint-disable @typescript-eslint/no-var-requires */

const { execSync } = require("child_process");
const { readFileSync } = require("fs");

const authorEmail = execSync(`git show -s --format='%ae' HEAD`)
  .toString("utf-8")
  .trim();

const authors = readFileSync("AUTHORS", "utf-8");
const isAuthor = authors.includes(`<${authorEmail}>`);

module.exports = {
  rules: {
    "signed-off-by": [isAuthor ? 0 : 2, "always", `Signed-off-by:`]
  }
};
