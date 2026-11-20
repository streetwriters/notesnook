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

// Usage: node scripts/with-hermes.mjs [command args...]
//
// Makes sure the pinned Hermes engine is in the shared per-user cache (see
// hermes-cache.mjs), then runs the command with RN_GPUI_HERMES_BIN_ROOT set to
// that cache, so the CMake build reads the folder the download went to.

import { spawnSync } from "node:child_process";
import { HermesUnavailableError, prepareHermes } from "./hermes-cache.mjs";

try {
  await prepareHermes();
} catch (error) {
  console.error(
    error instanceof HermesUnavailableError
      ? `\n${error.message}\n`
      : `with-hermes: ${error.message}`
  );
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (command) {
  // process.env now carries RN_GPUI_HERMES_BIN_ROOT.
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32"
  });
  process.exit(result.status ?? 1);
}
