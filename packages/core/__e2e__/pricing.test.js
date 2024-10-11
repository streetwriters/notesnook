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

import { Pricing } from "../src/api/pricing.ts";
import { test, expect, describe } from "vitest";

test.each(["monthly", "yearly", undefined])(`get %s price`, async (period) => {
  const price = await Pricing.price(period);
  expect(price).toMatchSnapshot(
    {
      country: expect.any(String),
      countryCode: expect.any(String),
      discount: expect.any(Number),
      price: expect.any(Number)
    },
    `${period || "monthly"}-pricing`
  );
});

describe.each(["android", "ios", "web"])(`get %s pricing tier`, (platform) => {
  test.each(["monthly", "yearly"])(
    `get %s ${platform} tier`,
    async (period) => {
      const price = await Pricing.sku(platform, period);
      expect(price).toMatchSnapshot(
        {
          country: expect.any(String),
          countryCode: expect.any(String),
          discount: expect.any(Number),
          sku: expect.any(String)
        },
        `${period}-${platform}-pricing`
      );
    }
  );
});
