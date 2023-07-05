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

import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { inAppPurchase } from "electron";

const t = initTRPC.create();

export const inAppPurchaseRouter = t.router({
  getProducts: t.procedure
    .input(z.array(z.string()))
    .query(async ({ input }) => {
      const products = await inAppPurchase.getProducts(input);
      return products.map((p) => {
        const price = p.introductoryPrice?.price || p.price;
        return {
          id: p.productIdentifier,
          price: { net: price, gross: price, tax: 0 },
          recurringPrice: { net: p.price, gross: p.price, tax: 0 },
          country: p.currencyCode,
          currency: p.currencyCode,
          name: p.localizedTitle,
          discount: { recurring: false, amount: 0 },
          period: p.subscriptionPeriod?.unit === "month" ? "monthly" : "yearly"
        } as const;
      });
    }),
  purchase: t.procedure
    .input(z.object({ productId: z.string(), userId: z.string() }))
    .query(({ input }) => {
      return inAppPurchase.purchaseProduct(input.productId, {
        username: input.userId
      });
    })
});
