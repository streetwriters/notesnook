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

// One Hermes engine download per user, shared by every checkout and worktree.
//
// @react-native-gpui/hermes downloads the engine into its own package folder
// (node_modules/@react-native-gpui/hermes/bin) unless RN_GPUI_HERMES_BIN_ROOT
// names another folder; its fetch script and its CMake build both read that
// variable. Here it defaults to a per-user cache, next to the prebuilt runtime
// the CLI already caches there, and an install goes through a lock and a
// staging folder that is renamed into place, so a build in another worktree
// never sees half-written files.

import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export const ENV_KEY = "RN_GPUI_HERMES_BIN_ROOT";
export const PREFETCH_COMMAND = "npm run prefetch:hermes";
const LOCK_NAME = ".lock";
/** A lock whose heartbeat is older than this was left by a killed build. */
const LOCK_STALE_MS = 2 * 60 * 1000;
const LOCK_HEARTBEAT_MS = 15 * 1000;
const LOCK_POLL_MS = 250;

/**
 * The per-user cache folder for Hermes: the platform's cache directory, then
 * `react-native-gpui/hermes` (the CLI keeps its prebuilt runtime in
 * `react-native-gpui/prebuilt` of the same directory).
 */
export function defaultHermesBinRoot({
  platform = process.platform,
  env = process.env,
  homedir = os.homedir()
} = {}) {
  const join = platform === "win32" ? path.win32.join : path.posix.join;
  let cache;
  if (platform === "darwin") cache = join(homedir, "Library", "Caches");
  else if (platform === "win32")
    cache = env.LOCALAPPDATA || join(homedir, "AppData", "Local");
  else cache = env.XDG_CACHE_HOME || join(homedir, ".cache");
  return join(cache, "react-native-gpui", "hermes");
}

/** An explicit RN_GPUI_HERMES_BIN_ROOT wins, unchanged; else the shared cache. */
export function resolveHermesBinRoot(options = {}) {
  const env = options.env ?? process.env;
  return env[ENV_KEY] || defaultHermesBinRoot({ ...options, env });
}

/** The installed @react-native-gpui/hermes package and what it pins. */
export async function hermesPackage() {
  const manifestPath = require.resolve(
    "@react-native-gpui/hermes/package.json"
  );
  const dir = path.dirname(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const fetchScript = path.join(dir, "scripts", "fetch-binaries.mjs");
  const fetcher = await import(pathToFileURL(fetchScript).href);
  // Same tag fetch-binaries.mjs downloads in its default mode.
  const tag = `@react-native-gpui/hermes@${
    manifest.hermes?.engineRelease ?? manifest.version
  }`;
  return {
    dir,
    fetchScript,
    tag,
    platform: fetcher.selectedPlatforms({})[0],
    repository: fetcher.repositoryFromManifest(manifest),
    installedState: fetcher.installedState
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function lockIsStale(lock) {
  let owner;
  try {
    owner = JSON.parse(fs.readFileSync(path.join(lock, "owner"), "utf8"));
  } catch {
    owner = null;
  }
  if (owner && owner.host === os.hostname()) {
    try {
      process.kill(owner.pid, 0);
    } catch (error) {
      // ESRCH: the owner is gone. EPERM: it exists but is not ours to signal.
      if (error.code === "ESRCH") return true;
    }
  }
  try {
    return Date.now() - fs.statSync(lock).mtimeMs > LOCK_STALE_MS;
  } catch {
    return false; // released meanwhile; the next mkdir decides
  }
}

/**
 * Takes the cache's lock: a directory, since mkdir either creates it or fails
 * on every platform and filesystem. The holder touches it while it works, and
 * a lock whose owner died or that went quiet is taken over.
 */
export async function acquireLock(root, { log = console.log } = {}) {
  const lock = path.join(root, LOCK_NAME);
  fs.mkdirSync(root, { recursive: true });
  let told = false;
  for (;;) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    if (lockIsStale(lock)) {
      fs.rmSync(lock, { recursive: true, force: true });
      continue;
    }
    if (!told) {
      log(`Waiting for another build to finish installing Hermes in ${root}`);
      told = true;
    }
    await sleep(LOCK_POLL_MS);
  }
  fs.writeFileSync(
    path.join(lock, "owner"),
    JSON.stringify({ pid: process.pid, host: os.hostname() })
  );
  const heartbeat = setInterval(() => {
    const now = new Date();
    try {
      fs.utimesSync(lock, now, now);
    } catch {
      // taken over after all; the rename below still only swaps whole folders
    }
  }, LOCK_HEARTBEAT_MS);
  heartbeat.unref();
  const release = () => {
    clearInterval(heartbeat);
    process.off("exit", release);
    fs.rmSync(lock, { recursive: true, force: true });
  };
  process.on("exit", release);
  return release;
}

function runFetch(fetchScript, args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [fetchScript, ...args], {
      env,
      stdio: ["ignore", "inherit", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", (error) => resolve({ ok: false, stderr: error.message }));
    child.on("close", (code) => resolve({ ok: code === 0, stderr }));
  });
}

export class HermesUnavailableError extends Error {}

/** What to do when the shared copy is missing and cannot be downloaded here. */
export function unavailableMessage({
  root,
  platform,
  tag,
  repository,
  fetchScript,
  reason
}) {
  const zip = `hermes-${platform}.zip`;
  const url = `https://github.com/${repository}/releases/download/${encodeURIComponent(
    tag
  )}/${zip}`;
  return [
    `The Hermes engine (${tag}, ${platform}) is not in the shared cache at`,
    `  ${root}`,
    `and could not be downloaded${reason ? `: ${reason.trim()}` : "."}`,
    "",
    "Run this once where the network is reachable (outside the sandbox); every",
    "worktree then reuses the copy without downloading:",
    `  cd "${appRoot}" && ${PREFETCH_COMMAND}`,
    "",
    `Or download ${zip} yourself from`,
    `  ${url}`,
    "and install it into the cache with fetch-binaries.mjs --from:",
    `  ${ENV_KEY}="${root}" node "${fetchScript}" --platform ${platform} --from /path/to/${zip}`,
    `(${PREFETCH_COMMAND} -- --from /path/to/${zip} does the same through the cache's lock.)`
  ].join("\n");
}

function removeLeftovers(root) {
  for (const entry of fs.readdirSync(root)) {
    if (entry.startsWith(".staging-") || entry.startsWith(".old-"))
      fs.rmSync(path.join(root, entry), { recursive: true, force: true });
  }
}

/**
 * Makes sure `<root>/<platform>` holds the pinned Hermes release, or the
 * artifact given with `from`.
 *
 * A complete folder whose `.release` names the pinned tag (or a hand-installed
 * build, which fetch-binaries.mjs keeps too) is used as it is, without the
 * lock or the network. Otherwise, under the lock, fetch-binaries.mjs installs
 * into a staging folder next to the cache, and the platform folder is swapped
 * in with renames, so readers see the old folder or the new one, never a part.
 */
export async function ensureHermes({
  root,
  platform,
  tag,
  fetchScript,
  installedState,
  repository,
  from,
  env = process.env,
  log = console.log
}) {
  const usable = () => {
    const { state } = installedState(platform, tag, root);
    return state === "current" || state === "foreign";
  };
  if (!from && usable()) {
    log(`Hermes ${tag} for ${platform}: using the shared copy in ${root}`);
    return { fetched: false };
  }

  const release = await acquireLock(root, { log });
  try {
    if (!from && usable()) {
      log(
        `Hermes ${tag} for ${platform}: installed by another build in ${root}`
      );
      return { fetched: false };
    }
    removeLeftovers(root);
    const staging = fs.mkdtempSync(path.join(root, ".staging-"));
    const args = ["--platform", platform];
    if (from) args.push("--from", path.resolve(from));
    const result = await runFetch(fetchScript, args, {
      ...env,
      [ENV_KEY]: staging
    });
    const staged = path.join(staging, platform);
    if (!result.ok || !fs.existsSync(staged)) {
      fs.rmSync(staging, { recursive: true, force: true });
      if (from) throw new Error(`fetch-binaries.mjs --from ${from} failed`);
      throw new HermesUnavailableError(
        unavailableMessage({
          root,
          platform,
          tag,
          repository,
          fetchScript,
          reason: result.stderr.replace(/^fetch-binaries: /, "")
        })
      );
    }
    const target = path.join(root, platform);
    const old = path.join(root, `.old-${process.pid}-${Date.now()}`);
    if (fs.existsSync(target)) fs.renameSync(target, old);
    fs.renameSync(staged, target);
    fs.rmSync(old, { recursive: true, force: true });
    fs.rmSync(staging, { recursive: true, force: true });
    log(`Hermes for ${platform} installed in ${target}`);
    return { fetched: true };
  } finally {
    release();
  }
}

/** Resolves the root, exports it for child processes and fills the cache. */
export async function prepareHermes({ from } = {}) {
  const root = resolveHermesBinRoot();
  process.env[ENV_KEY] = root;
  const hermes = await hermesPackage();
  await ensureHermes({ ...hermes, root, from });
  return root;
}
