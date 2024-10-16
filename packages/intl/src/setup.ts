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

let i18nGlobal: I18n | undefined = undefined;

export const setI18nGlobal = (i18n: I18n) => {
  i18nGlobal = i18n;
};

export function getI18nGlobal() {
  return i18nGlobal;
}
export const i18n = new Proxy(
  {},
  {
    get: (target, property) => {
      return (
        i18nGlobal?.[property as keyof I18n] || i18nn[property as keyof I18n]
      );
    }
  }
);
