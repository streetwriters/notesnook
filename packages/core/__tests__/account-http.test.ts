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

import { test, expect, vi, afterEach } from "vitest";
import http from "../src/utils/http.js";
import TokenManager from "../src/api/token-manager.js";
import { Offers } from "../src/api/offers.js";
import { EVENTS } from "../src/common.js";
import { SubscriptionPlan } from "../src/types.js";
import { databaseTest } from "./utils/index.js";

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" }
    })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("form data keeps false and 0 values", async () => {
  const fetchMock = mockFetch({});
  await http.post("https://example.com", {
    removeAttachments: false,
    count: 0,
    skipped: undefined
  });
  expect(fetchMock.mock.calls[0][1].body).toBe(
    "removeAttachments=false&count=0"
  );
});

test("query params are url encoded", () =>
  databaseTest().then(async (db) => {
    vi.spyOn(db.user, "getUser").mockResolvedValue({
      id: "user-1",
      email: "a+b@example.com"
    } as any);
    const url = new URL(
      (await db.subscriptions.checkoutUrl(SubscriptionPlan.PRO, "monthly"))!
    );
    expect(url.searchParams.get("email")).toBe("a+b@example.com");

    const fetchMock = mockFetch({ code: "x" });
    await Offers.getCode("a+b&c", "web");
    const offerUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(offerUrl.searchParams.get("promoCode")).toBe("a+b&c");
  }));

test("revoked refresh token expires the session", async () => {
  mockFetch(
    {
      error: "invalid_grant",
      error_description: "The refresh token is invalid."
    },
    400
  );
  const store: Record<string, unknown> = {
    token: {
      access_token: "access",
      refresh_token: "refresh",
      scope: "notesnook.sync offline_access IdentityServerApi",
      expires_in: 3600,
      t: 0
    }
  };
  const storage = {
    read: async (key: string) => store[key],
    write: async (key: string, value: unknown) => void (store[key] = value),
    delete: async (key: string) => void delete store[key]
  };
  const eventManager = { publish: vi.fn() };
  const tokenManager = new TokenManager(
    (() => storage) as any,
    eventManager as any
  );

  await expect(tokenManager.getAccessToken()).rejects.toThrow();
  expect(eventManager.publish).toHaveBeenCalledWith(EVENTS.userSessionExpired);
});
