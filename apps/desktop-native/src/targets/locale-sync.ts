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

import { environment } from "@platform";
import Config from "../app/utils/config";
import { initLocaleSync as initIntlLocaleSync } from "@notesnook/intl";

/**
 * Synchronous start-up locale: the saved language, or the system locale when
 * none is saved. Web only has the async initLocale in common/locale.
 */
export function initLocaleSync() {
  return initIntlLocaleSync({
    getSavedLocale: () => Config.get<string>("appLanguage", ""),
    systemLocale: environment.locale ?? "en"
  });
}
