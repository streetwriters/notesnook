import { execSync } from "child_process";
import { readFileSync } from "fs";

const SCOPES = [
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
  "themebuilder",
  "intl",
  "webclipper"
];

function getAuthorEmail() {
  try {
    return execSync(`git config --global --get user.email`)
      .toString("utf-8")
      .trim();
  } catch (error) {
    return "";
  }
}

function isAuthor(email) {
  try {
    const authors = readFileSync("AUTHORS", "utf-8");
    return authors.includes(`<${email}>`);
  } catch (error) {
    return false;
  }
}

function lintCommit(message) {
  const errors = [];
  const lines = message.split("\n");
  const firstLine = lines[0];

  // Check if type is empty
  if (!firstLine.trim()) {
    errors.push("❌ Commit message cannot be empty");
    return errors;
  }

  // Parse commit message (format: type(scope): subject or type: subject)
  const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?\s*:\s*(.+)$/);

  if (!match) {
    errors.push(
      `❌ Invalid commit format. Expected: "type(scope): subject" or "type: subject"`
    );
    errors.push(`   Got: "${firstLine}"`);
  } else {
    const [, type] = match;

    // Check if type is in the allowed scopes
    if (!SCOPES.includes(type)) {
      errors.push(`❌ Invalid type: "${type}"`);
      errors.push(`   Allowed types: ${SCOPES.join(", ")}`);
    }
  }

  // Check for signed-off-by
  const authorEmail = getAuthorEmail();
  const hasSignedOff = message.includes("Signed-off-by:");

  if (!isAuthor(authorEmail) && !hasSignedOff) {
    errors.push(`❌ Commit must include "Signed-off-by:" trailer`);
    errors.push(`   You are not in the AUTHORS file (<${authorEmail}>)`);
  }

  return errors;
}

// Main execution
const commitMessage = readFileSync(
  process.argv[2] || ".git/COMMIT_EDITMSG",
  "utf-8"
);
const errors = lintCommit(commitMessage);

if (errors.length > 0) {
  console.error("\n🚫 Commit message validation failed:\n");
  errors.forEach((error) => console.error(error));
  console.error("");
  process.exit(1);
} else {
  console.log("✅ Commit message is valid");
  process.exit(0);
}
