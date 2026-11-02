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
import { I18n, i18n as i18nn } from "@lingui/core";

const GLOBAL_I18N_KEY = "__notesnook_i18n__";

export const setI18nGlobal = (newI18n: any) => {
  if (newI18n === i18n) return;
  (globalThis as any)[GLOBAL_I18N_KEY] = newI18n;
};

export function getI18nGlobal() {
  return (globalThis as any)[GLOBAL_I18N_KEY];
}
export const i18n: I18n = new Proxy({} as I18n, {
  get: (target, property) => {
    const active = (globalThis as any)[GLOBAL_I18N_KEY] || i18nn;
    const value = active[property as keyof I18n];
    if (typeof value === "function") {
      return value.bind(active);
    }
    return value;
  }
});
