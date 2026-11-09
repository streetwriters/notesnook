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

import { execFileSync } from "node:child_process";

function appPids(binary: string) {
  const list = execFileSync("ps", ["-axo", "pid=,command="], {
    encoding: "utf8"
  });
  const pids: number[] = [];
  for (const line of list.split("\n")) {
    const match = line.trim().match(/^(\d+)\s+(.+)$/u);
    if (!match) continue;
    const pid = Number(match[1]);
    if (pid === process.pid) continue;
    if (match[2] === binary || match[2].startsWith(`${binary} `))
      pids.push(pid);
  }
  return pids;
}

function stop(pids: number[]) {
  for (const pid of pids)
    try {
      process.kill(pid, "SIGTERM");
    } catch {}
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if (pids.every((pid) => !isAlive(pid))) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  for (const pid of pids)
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export default function setup() {
  const binary = process.env.RN_GPUI_TEST_BINARY;
  if (!binary) return;
  stop(appPids(binary));
  return () => {
    const left = appPids(binary);
    if (left.length === 0) return;
    stop(left);
    throw new Error(
      `${
        left.length
      } app process(es) of this checkout were left running by the run: ${left.join(
        ", "
      )}`
    );
  };
}
