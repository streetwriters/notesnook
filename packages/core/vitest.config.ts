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

const IS_E2E = process.env.IS_E2E === "true";
const IS_CI = !!process.env.CI;

export default defineConfig({
  test: {
    globalSetup: ["./__tests__/setup/global.setup.ts"],
    setupFiles: ["./__tests__/setup/test.setup.ts"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["src/utils/templates/html/languages/*.js"],
      include: ["src/**/*.ts"]
    },
    retry: IS_CI ? 1 : 0,
    exclude: ["__benches__/**/*.bench.ts"],
    include: [
      ...(IS_E2E ? ["__e2e__/**/*.test.{js,ts}"] : []),
      "__tests__/**/*.test.{js,ts}",
      "src/**/*.test.{js,ts}"
    ],
    benchmark: {
      include: ["__benches__/**/*.bench.ts"]
    }
  }
});
