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

import {
  getCurrencySymbol as _getSymbol,
  ICurrencySymbols
} from "@brixtol/currency-symbols";

export const IS_DEV = import.meta.env.DEV || IS_TESTING;
export function getCurrencySymbol(currency: string) {
  return _getSymbol(currency as keyof ICurrencySymbols) || currency;
}

export function parseAmount(amount: string) {
  const matches = /(.+?)([\d.]+)/.exec(amount);
  if (!matches || matches.length < 3) return;
  return {
    formatted: amount,
    symbol: matches[1],
    amount: parseFloat(matches[2])
  };
}
