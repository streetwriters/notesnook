import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = path.join(root, "desktop/build");
const target = path.join(build, "target");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const withRelease = args.includes("--release");
const withDeps = args.includes("--deps");
const ensureIndex = args.indexOf("--ensure");
const ensureGiB = ensureIndex >= 0 ? Number(args[ensureIndex + 1]) : undefined;

function freeGiB() {
  const out = execFileSync("df", ["-k", root]).toString().split("\n")[1];
  return Number(out.trim().split(/\s+/)[3]) / 1024 / 1024;
}

function size(dir) {
  try {
    return (
      Number(execFileSync("du", ["-sk", dir]).toString().split("\t")[0]) * 1024
    );
  } catch {
    return 0;
  }
}

const gib = (bytes) => (bytes / 1024 ** 3).toFixed(2);
let freed = 0;

function remove(entry, reason) {
  const bytes = size(entry);
  freed += bytes;
  console.log(
    `${dryRun ? "would remove" : "removing"} ${path.relative(
      root,
      entry
    )} (${gib(bytes)} GiB, ${reason})`
  );
  if (!dryRun) fs.rmSync(entry, { recursive: true, force: true });
}

function staleDeps(depsDir) {
  const newest = new Map();
  const files = fs.readdirSync(depsDir);
  for (const name of files) {
    const match = /^(lib)?(.+)-([0-9a-f]{16})(\.[a-z.]+)?$/.exec(name);
    if (!match) continue;
    const key = `${match[2]}${match[4] ?? ""}`;
    const stat = fs.statSync(path.join(depsDir, name));
    const known = newest.get(key);
    if (!known || stat.mtimeMs > known.mtimeMs)
      newest.set(key, { hash: match[3], mtimeMs: stat.mtimeMs });
  }
  for (const name of files) {
    const match = /^(lib)?(.+)-([0-9a-f]{16})(\.[a-z.]+)?$/.exec(name);
    if (!match) continue;
    const keep = newest.get(`${match[2]}${match[4] ?? ""}`);
    if (keep && keep.hash !== match[3])
      remove(path.join(depsDir, name), "older build of the same crate");
  }
}

if (ensureGiB !== undefined && freeGiB() >= ensureGiB) {
  console.log(
    `free space ${freeGiB().toFixed(
      1
    )} GiB is above ${ensureGiB} GiB, nothing to do`
  );
  process.exit(0);
}

const before = freeGiB();
if (fs.existsSync(target)) {
  for (const profile of fs.readdirSync(target)) {
    const dir = path.join(target, profile);
    if (!fs.statSync(dir).isDirectory() || profile === "rn-gpui-cmake")
      continue;
    if (profile === "release" && withRelease) {
      remove(dir, "release profile");
      continue;
    }
    const incremental = path.join(dir, "incremental");
    if (fs.existsSync(incremental)) remove(incremental, "incremental cache");
    const deps = path.join(dir, "deps");
    if (withDeps && fs.existsSync(deps)) staleDeps(deps);
    for (const name of fs.readdirSync(dir))
      if (name.endsWith(".dSYM")) remove(path.join(dir, name), "dSYM");
  }
  const cmake = path.join(target, "rn-gpui-cmake");
  if (fs.existsSync(cmake) && withRelease)
    for (const triple of fs.readdirSync(cmake))
      for (const config of fs.readdirSync(path.join(cmake, triple)))
        if (config !== "Debug")
          remove(
            path.join(cmake, triple, config),
            "cmake configuration other than Debug"
          );
}
const failures = path.join(build, "e2e-failures");
if (fs.existsSync(failures)) remove(failures, "old failure artefacts");

console.log(
  `${dryRun ? "would free" : "freed"} about ${gib(
    freed
  )} GiB; free space ${before.toFixed(1)} -> ${
    dryRun ? before.toFixed(1) : freeGiB().toFixed(1)
  } GiB`
);
