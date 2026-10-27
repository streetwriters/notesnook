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

import { afterEach, expect, test, vi } from "vitest";
import http, { RequestError } from "../src/utils/http.js";

const URL = "https://api.example.com/users";

function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("a short Retry-After on a GET is waited out and retried once", async () => {
  vi.useFakeTimers();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      json(
        503,
        { error: "Service is temporarily unavailable." },
        { "Retry-After": "2" }
      )
    )
    .mockResolvedValueOnce(json(200, { id: "user" }));
  vi.stubGlobal("fetch", fetch);

  const result = http.get(URL);
  await vi.advanceTimersByTimeAsync(1999);
  expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);

  await expect(result).resolves.toEqual({ id: "user" });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("a long Retry-After fails right away with the delay on the error", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      json(
        503,
        { error: "Service is temporarily unavailable." },
        { "Retry-After": "30" }
      )
    );
  vi.stubGlobal("fetch", fetch);

  const error = await http.get(URL).catch((e) => e);

  expect(error).toBeInstanceOf(RequestError);
  expect(error.message).toBe("Service is temporarily unavailable.");
  expect(error.status).toBe(503);
  expect(error.retryAfter).toBe(30_000);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("requests that change data are never retried", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      json(
        503,
        { error: "Service is temporarily unavailable." },
        { "Retry-After": "1" }
      )
    );
  vi.stubGlobal("fetch", fetch);

  const error = await http.post(URL, { name: "x" }).catch((e) => e);

  expect(error.retryAfter).toBe(1000);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("an HTTP-date Retry-After is converted to a delay", async () => {
  const date = new Date(Date.now() + 60_000).toUTCString();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 429, headers: { "Retry-After": date } })
      )
  );

  const error = await http.get(URL).catch((e) => e);

  expect(error).toBeInstanceOf(RequestError);
  expect(error.code).toBe("rate_limited");
  expect(error.retryAfter).toBeGreaterThan(50_000);
  expect(error.retryAfter).toBeLessThanOrEqual(60_000);
});

test("a 503 without a body has a readable message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
  );

  const error = await http.get(URL).catch((e) => e);

  expect(error).toBeInstanceOf(RequestError);
  expect(error.message).toBe(
    "Service is temporarily unavailable. Please try again later."
  );
  expect(error.status).toBe(503);
  expect(error.retryAfter).toBeUndefined();
});

test("JSON errors keep their message and expose the status", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(json(400, { error: "Wrong password." }))
  );

  const error = await http.post(URL, { password: "x" }).catch((e) => e);

  expect(error.message).toBe("Wrong password.");
  expect(error.status).toBe(400);
  expect(error.retryAfter).toBeUndefined();
});
