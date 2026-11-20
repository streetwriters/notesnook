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

// Usage: npm run prefetch:hermes [-- --from <hermes-<platform>.zip|dir>]
//
// Downloads the pinned Hermes engine into the shared per-user cache once, so
// builds in any worktree (or in a sandbox without network) reuse it. With
// --from, installs a manually downloaded artifact into the cache instead.

import { HermesUnavailableError, prepareHermes } from "./hermes-cache.mjs";

const argv = process.argv.slice(2);
let from;
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--from" && argv[i + 1]) from = argv[++i];
  else {
    console.error(
      "Usage: npm run prefetch:hermes [-- --from <hermes-<platform>.zip|dir>]"
    );
    process.exit(2);
  }
}

try {
  const root = await prepareHermes({ from });
  console.log(`Hermes cache: ${root}`);
} catch (error) {
  console.error(
    error instanceof HermesUnavailableError
      ? `\n${error.message}\n`
      : `prefetch-hermes: ${error.message}`
  );
  process.exit(1);
}
