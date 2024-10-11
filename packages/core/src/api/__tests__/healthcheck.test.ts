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

import { HealthCheck, check } from "../healthcheck.js";
import { describe } from "vitest";

describe.concurrent("Health check", (test) => {
  test("Auth", async (t) => {
    const result = await HealthCheck.auth();
    t.expect(result).toBe(true);
  });

  test("Healthy host", async (t) => {
    const host = "https://api.notesnook.com";
    const result = await check(host);
    t.expect(result).toBe(true);
  });

  test("Unhealthy host", async (t) => {
    const host = "https://example.com";
    // Simulate an error by passing an invalid host
    const result = await check(host);
    t.expect(result).toBe(false);
  });
});
