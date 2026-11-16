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
import path from "path";

const SHARED = [
  "react",
  "react-dom",
  "@emotion/react",
  "zustand",
  "use-sync-external-store"
];

export default defineConfig({
  resolve: {
    mainFields: ["module", "jsnext:main", "jsnext"],
    alias: SHARED.map((name) => ({
      find: name,
      replacement: path.resolve(__dirname, "node_modules", name)
    }))
  },
  test: {
    alias: {
      "@/": "./"
    },
    environment: "happy-dom",
    server: { deps: { inline: [/@notesnook\//, /zustand/] } },
    typecheck: {
      tsconfig: "./tsconfig.tests.json"
    }
  }
});
