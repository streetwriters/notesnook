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

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";

const buildDir = path.resolve(__dirname, "../build");
const lockFile = path.join(buildDir, "e2e.lock");
const pidDir = path.join(buildDir, "e2e-pids");

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function stop(pids: number[]) {
  const alive = pids.filter(isAlive);
  for (const pid of alive)
    try {
      process.kill(pid, "SIGTERM");
    } catch {}
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline && alive.some(isAlive)) sleep(100);
  for (const pid of alive.filter(isAlive))
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
}

function readPidFiles() {
  if (!existsSync(pidDir)) return [];
  return readdirSync(pidDir)
    .map((name) => {
      const match = name.match(/^(\d+)-(\d+)$/u);
      return match
        ? {
            file: path.join(pidDir, name),
            run: Number(match[1]),
            app: Number(match[2])
          }
        : undefined;
    })
    .filter(
      (entry): entry is { file: string; run: number; app: number } => !!entry
    );
}

export default function setup() {
  mkdirSync(pidDir, { recursive: true });
  if (existsSync(lockFile)) {
    const holder = Number(readFileSync(lockFile, "utf8").trim());
    if (Number.isInteger(holder) && holder !== process.pid && isAlive(holder))
      throw new Error(
        `another e2e run of this checkout is active (pid ${holder}); wait for it to finish, or stop it, before starting a new one`
      );
  }
  for (const entry of readPidFiles()) {
    if (isAlive(entry.run)) continue;
    stop([entry.app]);
    rmSync(entry.file, { force: true });
  }
  writeFileSync(lockFile, String(process.pid));
  process.env.RN_GPUI_E2E_RUN = String(process.pid);

  return () => {
    const left = readPidFiles().filter((entry) => entry.run === process.pid);
    const running = left.filter((entry) => isAlive(entry.app));
    stop(running.map((entry) => entry.app));
    for (const entry of left) rmSync(entry.file, { force: true });
    rmSync(lockFile, { force: true });
    if (running.length > 0)
      throw new Error(
        `${
          running.length
        } app process(es) launched by this run were left running: ${running
          .map((entry) => entry.app)
          .join(", ")}`
      );
  };
}
