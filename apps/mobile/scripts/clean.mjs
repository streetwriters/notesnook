import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import readline from "readline";

const PROJECT_ROOT = path.resolve(
  new URL(import.meta.url).pathname,
  "..",
  ".."
); // scripts/.. -> mobile
const args = process.argv.slice(2);

const FLAGS = {
  yes: args.includes("-y") || args.includes("--yes"),
  dryRun: args.includes("--dry-run"),
  all: args.includes("--all"),
  verbose: args.includes("-v") || args.includes("--verbose")
};

const DEFAULT_TARGETS = [
  "node_modules",
  "android/build",
  "android/app/build",
  "ios/Pods",
  "ios/DerivedData" // sometimes used as DerivedData path
];

const EXTRA_TARGETS = [
  "android/.gradle",
  ".gradle",
  "ios/build",
  "ios/Podfile.lock",
  "ios/xcuserdata",
  ".expo",
  ".expo-shared",
  ".vscode",
  "build",
  ".idea"
];

const targets = new Set([
  ...DEFAULT_TARGETS,
  ...(FLAGS.all ? EXTRA_TARGETS : [])
]);

function resolveTargets(root) {
  return [...targets].map((t) => ({ rel: t, abs: path.resolve(root, t) }));
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function execPromise(cmd) {
  return new Promise((res, rej) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) return rej({ err, stdout, stderr });
      res({ stdout, stderr });
    });
  });
}

async function removeWithNode(p) {
  // fs.rm is available in Node 14.14+; fallback to rmdir if necessary
  if (fs.rm) {
    await fs.rm(p, { recursive: true, force: true });
  } else if (fs.rmdir) {
    // rmdir with recursive option deprecated in some nodes but try
    await fs.rmdir(p, { recursive: true });
  } else {
    throw new Error("No supported fs remove method found");
  }
}

async function removePath(p) {
  if (FLAGS.verbose) console.log("Removing:", p);
  try {
    // Prefer Node API
    await removeWithNode(p);
    return { ok: true };
  } catch (nodeErr) {
    // Fallback to shell command
    const isWin = os.platform() === "win32";
    const cmd = isWin ? `rd /s /q "${p}"` : `rm -rf "${p}"`;
    try {
      await execPromise(cmd);
      return { ok: true, fallback: true };
    } catch (shellErr) {
      return { ok: false, error: shellErr };
    }
  }
}

async function confirmPrompt(message) {
  if (FLAGS.yes) return true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const answer = await new Promise((res) =>
    rl.question(`${message} (y/N): `, (ans) => {
      rl.close();
      res(ans);
    })
  );
  return /^y(es)?$/i.test(answer.trim());
}

async function run() {
  console.log("Project root:", PROJECT_ROOT);
  const resolved = resolveTargets(PROJECT_ROOT);
  const existing = [];
  for (const t of resolved) {
    if (await pathExists(t.abs)) existing.push(t);
  }
  if (existing.length === 0) {
    console.log("No matching targets found. Nothing to do.");
    return;
  }
  console.log("Will remove the following paths:");
  for (const e of existing) console.log(" -", e.rel);
  if (FLAGS.dryRun) {
    console.log("\nDry-run mode enabled. No files will be removed.");
    return;
  }
  const ok = await confirmPrompt("Proceed to delete the listed paths?");
  if (!ok) {
    console.log("Aborted by user.");
    return;
  }
  const results = [];
  for (const e of existing) {
    try {
      const res = await removePath(e.abs);
      results.push({ target: e.rel, success: res.ok, info: res });
      console.log(res.ok ? `Deleted: ${e.rel}` : `Failed: ${e.rel}`);
    } catch (err) {
      results.push({ target: e.rel, success: false, info: err });
      console.log(`Failed: ${e.rel} — ${err?.message || err}`);
    }
  }
  const deleted = results.filter((r) => r.success).length;
  const failed = results.length - deleted;
  console.log(`\nSummary: ${deleted} deleted, ${failed} failed.`);
  if (failed > 0) {
    console.log("Failed items:");
    for (const f of results.filter((r) => !r.success))
      console.log(" -", f.target);
  }
  console.log("Done.");
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exitCode = 1;
});
