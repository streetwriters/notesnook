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


import { test, expect, vi } from "vitest";
import { databaseTest } from "./utils/index.ts";
import http from "../src/utils/http.js";

vi.mock("../src/utils/http.js", () => ({
  default: {
    get: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    patch: { json: vi.fn().mockResolvedValue(undefined) },
    delete: vi.fn().mockResolvedValue(undefined)
  }
}));

test("sync connection and db share the token refresh lock", () =>
  databaseTest().then(async (db) => {
    await db.kv().write("token", {
      access_token: "access-1",
      refresh_token: "refresh-1",
      scope: "notesnook.sync offline_access IdentityServerApi",
      token_type: "Bearer",
      expires_in: 3600,
      t: Date.now() - 2 * 3600 * 1000
    });

    let refreshes = 0;
    vi.mocked(http.post).mockImplementation(async (url: string) => {
      if (!url.endsWith("/connect/token")) return;
      const n = ++refreshes;
      await new Promise((r) => setTimeout(r, 50));
      return {
        access_token: `access-${n + 1}`,
        refresh_token: `refresh-${n + 1}`,
        scope: "notesnook.sync offline_access IdentityServerApi",
        token_type: "Bearer",
        expires_in: 3600
      };
    });

    const { HubConnectionBuilder } = await import("@microsoft/signalr");
    const withUrl = vi.spyOn(HubConnectionBuilder.prototype, "withUrl");
    await (db.syncer.sync as any).createConnection({});
    const options = withUrl.mock.calls[0][1] as {
      accessTokenFactory: () => Promise<string>;
    };

    await Promise.all([
      db.tokenManager.getAccessToken(),
      options.accessTokenFactory()
    ]);

    expect(refreshes).toBe(1);
  }));
