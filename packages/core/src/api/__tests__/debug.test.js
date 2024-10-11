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

import { Debug } from "../debug.ts";
import createFetchMock from "vitest-fetch-mock";
import { vi, test, expect } from "vitest";
const fetchMocker = createFetchMock(vi);

const SUCCESS_REPORT_RESPONSE = {
  url: "https://reported/"
};

test("reporting issue should return issue url", async () => {
  fetchMocker.enableMocks();

  fetch.mockResponseOnce(JSON.stringify(SUCCESS_REPORT_RESPONSE), {
    headers: { "Content-Type": "application/json" }
  });

  expect(
    await Debug.report({
      title: "I am title",
      body: "I am body",
      userId: "anything"
    })
  ).toBe(SUCCESS_REPORT_RESPONSE.url);

  fetchMocker.disableMocks();
});

test("reporting invalid issue should return undefined", async () => {
  fetchMocker.enableMocks();

  fetch.mockResponseOnce(
    JSON.stringify({
      error_description: "Invalid issue."
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );

  expect(await Debug.report({})).toBeUndefined();

  fetchMocker.disableMocks();
});
