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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  HermesUnavailableError,
  defaultHermesBinRoot,
  ensureHermes,
  resolveHermesBinRoot
} from "./hermes-cache.mjs";

describe("resolveHermesBinRoot", () => {
  test("macOS uses ~/Library/Caches", () => {
    expect(
      defaultHermesBinRoot({ platform: "darwin", env: {}, homedir: "/Users/u" })
    ).toBe("/Users/u/Library/Caches/react-native-gpui/hermes");
  });

  test("Linux uses $XDG_CACHE_HOME, else ~/.cache", () => {
    expect(
      defaultHermesBinRoot({
        platform: "linux",
        env: { XDG_CACHE_HOME: "/xdg" },
        homedir: "/home/u"
      })
    ).toBe("/xdg/react-native-gpui/hermes");
    expect(
      defaultHermesBinRoot({ platform: "linux", env: {}, homedir: "/home/u" })
    ).toBe("/home/u/.cache/react-native-gpui/hermes");
  });

  test("Windows uses %LOCALAPPDATA%, else AppData\\Local", () => {
    expect(
      defaultHermesBinRoot({
        platform: "win32",
        env: { LOCALAPPDATA: "C:\\Users\\u\\AppData\\Local" },
        homedir: "C:\\Users\\u"
      })
    ).toBe("C:\\Users\\u\\AppData\\Local\\react-native-gpui\\hermes");
    expect(
      defaultHermesBinRoot({
        platform: "win32",
        env: {},
        homedir: "C:\\Users\\u"
      })
    ).toBe("C:\\Users\\u\\AppData\\Local\\react-native-gpui\\hermes");
  });

  test("an explicit RN_GPUI_HERMES_BIN_ROOT wins unchanged", () => {
    expect(
      resolveHermesBinRoot({
        platform: "darwin",
        env: { RN_GPUI_HERMES_BIN_ROOT: "./my/hermes" },
        homedir: "/Users/u"
      })
    ).toBe("./my/hermes");
    expect(
      resolveHermesBinRoot({ platform: "darwin", env: {}, homedir: "/Users/u" })
    ).toBe("/Users/u/Library/Caches/react-native-gpui/hermes");
  });
});

// A stand-in for fetch-binaries.mjs: writes two files slowly, then .release,
// into $RN_GPUI_HERMES_BIN_ROOT/<platform>, and logs each run.
const FAKE_FETCH = `
import fs from "node:fs";
import path from "node:path";
const platform = process.argv[process.argv.indexOf("--platform") + 1];
fs.appendFileSync(process.env.FAKE_RUNS, process.env.RN_GPUI_HERMES_BIN_ROOT + "\\n");
if (process.env.FAKE_MODE === "fail") {
  console.error("fetch-binaries: getaddrinfo ENOTFOUND github.com");
  process.exit(1);
}
const dir = path.join(process.env.RN_GPUI_HERMES_BIN_ROOT, platform);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "lib"), "lib");
await new Promise((r) => setTimeout(r, 300));
fs.writeFileSync(path.join(dir, "hermesc"), "hermesc");
fs.writeFileSync(path.join(dir, ".release"), process.env.FAKE_TAG + "\\n");
`;

const PLATFORM = "test-platform";
const TAG = "@react-native-gpui/hermes@9.9.9";

function installedState(platform, tag, root) {
  const dir = path.join(root, platform);
  const complete = ["lib", "hermesc"].every((f) =>
    fs.existsSync(path.join(dir, f))
  );
  if (!complete) return { state: "missing" };
  let source = null;
  try {
    source = fs.readFileSync(path.join(dir, ".release"), "utf8").trim();
  } catch {
    // no marker
  }
  return { state: source === tag ? "current" : "stale" };
}

describe("ensureHermes", () => {
  let tmp, root, runs, options;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-cache-test-"));
    root = path.join(tmp, "cache");
    runs = path.join(tmp, "runs.log");
    fs.writeFileSync(runs, "");
    const fetchScript = path.join(tmp, "fake-fetch.mjs");
    fs.writeFileSync(fetchScript, FAKE_FETCH);
    options = {
      root,
      platform: PLATFORM,
      tag: TAG,
      fetchScript,
      installedState,
      repository: "owner/repo",
      env: { ...process.env, FAKE_RUNS: runs, FAKE_TAG: TAG },
      log: () => {}
    };
  });

  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const fetchRuns = () =>
    fs.readFileSync(runs, "utf8").split("\n").filter(Boolean);

  test("a current copy is used without running the fetch", async () => {
    await ensureHermes(options);
    expect(fetchRuns()).toHaveLength(1);
    const result = await ensureHermes({
      ...options,
      env: { ...options.env, FAKE_MODE: "fail" }
    });
    expect(result.fetched).toBe(false);
    expect(fetchRuns()).toHaveLength(1);
  });

  test("the fetch writes to a staging folder, then the whole folder moves in", async () => {
    await ensureHermes(options);
    const [stagedTo] = fetchRuns();
    expect(path.dirname(stagedTo)).toBe(root);
    expect(path.basename(stagedTo)).toMatch(/^\.staging-/);
    expect(fs.readdirSync(root).sort()).toEqual([PLATFORM]);
    expect(installedState(PLATFORM, TAG, root).state).toBe("current");
  });

  test("builds running at once download once and never see a partial folder", async () => {
    const seen = [];
    const watcher = setInterval(() => {
      const dir = path.join(root, PLATFORM);
      if (fs.existsSync(dir))
        seen.push(installedState(PLATFORM, TAG, root).state);
    }, 5);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => ensureHermes(options))
    );
    clearInterval(watcher);
    expect(fetchRuns()).toHaveLength(1);
    expect(results.filter((r) => r.fetched)).toHaveLength(1);
    expect(seen.every((state) => state === "current")).toBe(true);
    expect(fs.existsSync(path.join(root, ".lock"))).toBe(false);
  });

  test("a copy from another release is replaced", async () => {
    const dir = path.join(root, PLATFORM);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "lib"), "old");
    fs.writeFileSync(path.join(dir, "hermesc"), "old");
    fs.writeFileSync(
      path.join(dir, ".release"),
      "@react-native-gpui/hermes@0.0.1\n"
    );
    const result = await ensureHermes(options);
    expect(result.fetched).toBe(true);
    expect(fs.readFileSync(path.join(dir, "lib"), "utf8")).toBe("lib");
    expect(installedState(PLATFORM, TAG, root).state).toBe("current");
  });

  test("a lock left by a dead build is taken over", async () => {
    fs.mkdirSync(path.join(root, ".lock"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".lock", "owner"),
      JSON.stringify({ pid: 2 ** 22 + 12345, host: os.hostname() })
    );
    fs.mkdirSync(path.join(root, ".staging-left"), { recursive: true });
    await ensureHermes(options);
    expect(fs.readdirSync(root).sort()).toEqual([PLATFORM]);
  });

  test("without network it fails with the command to run and the --from install", async () => {
    const error = await ensureHermes({
      ...options,
      env: { ...options.env, FAKE_MODE: "fail" }
    }).catch((e) => e);
    expect(error).toBeInstanceOf(HermesUnavailableError);
    expect(error.message).toContain("npm run prefetch:hermes");
    expect(error.message).toContain("ENOTFOUND github.com");
    expect(error.message).toContain(
      `RN_GPUI_HERMES_BIN_ROOT="${root}" node "${options.fetchScript}" --platform ${PLATFORM} --from /path/to/hermes-${PLATFORM}.zip`
    );
    expect(error.message).toContain(
      "https://github.com/owner/repo/releases/download/%40react-native-gpui%2Fhermes%409.9.9/hermes-test-platform.zip"
    );
    expect(fs.readdirSync(root)).toEqual([]);
  });
});
