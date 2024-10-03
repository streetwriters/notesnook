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

import { messages as _$en } from "../locales/$en.json";
import { messages as _$de } from "../locales/$de.json";
import { messages as _$fr } from "../locales/$fr.json";
import type { Messages } from "@lingui/core";

export const $en = _$en as Messages;
export const $de = _$de as Messages;
export const $fr = _$fr as Messages;
export { strings } from "./strings";
export { setI18nGlobal } from "./setup";
