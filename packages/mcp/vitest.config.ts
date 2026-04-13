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

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Ensure the Node.js export conditions are used for packages like
    // @notesnook/sodium that have separate node/browser entry points.
    conditions: ["node", "import", "module", "require", "default"]
  },
  test: {
    include: ["src/**/*.test.ts"],
    server: {
      deps: {
        // Let Node resolve native modules directly rather than bundling them
        // through Vite, which can't handle .node binaries or WASM.
        external: [
          // Native add-ons and WASM modules cannot be bundled by Vite
          /better-sqlite3/,
          /sqlite-better-trigram/,
          /sqlite3-fts5-html/,
          /sqlite-regex/,
          // @notesnook/sodium ships WASM and has complex node/browser exports;
          // externalize the whole @notesnook scope to let Node resolve them.
          /@notesnook\//
        ]
      }
    }
  }
});
