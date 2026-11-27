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
  // jsdom tests transform as web modules, which only reads files the dev server
  // may serve: the kit lives in packages/ui, outside this package.
  server: { fs: { allow: ["../.."] } },
  test: {
    include: [
      "src/**/*.test.ts",
      "scripts/**/*.test.mjs",
      "tools/divergence/**/*.test.mjs",
      "tools/codemod/**/*.test.mjs",
      "../../packages/ui/src/kit/{contracts,desktop,web,shared}/**/*.test.ts"
    ],
    environment: "node"
  }
});
