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

import { setI18nGlobal, getSupportedLocale } from "@notesnook/intl";
import { i18n } from "@lingui/core";
import SettingsService from "../../services/settings";

const localeCache = {};
const localeCatalogs = {};

const LOCALE_LOADERS = {
  en: () => require("@notesnook/intl/dist/locales/$en.json").messages,
  fr: () => require("@notesnook/intl/dist/locales/$fr.json").messages,
  es: () => require("@notesnook/intl/dist/locales/$es.json").messages,
  de: () => require("@notesnook/intl/dist/locales/$de.json").messages,
  it: () => require("@notesnook/intl/dist/locales/$it.json").messages
};

for (const locale of Object.keys(LOCALE_LOADERS)) {
  Object.defineProperty(localeCatalogs, locale, {
    enumerable: true,
    get() {
      if (!localeCache[locale]) {
        localeCache[locale] = LOCALE_LOADERS[locale]();
      }
      return localeCache[locale];
    }
  });
}

export function initLocale() {
  const savedLanguage = SettingsService.getProperty("appLanguage");
  let targetLang;

  if (savedLanguage && localeCatalogs[savedLanguage]) {
    targetLang = savedLanguage;
  } else {
    let systemLocale = "en";
    try {
      systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch (e) {}
    targetLang = getSupportedLocale(systemLocale);
  }

  i18n.load(localeCatalogs);
  i18n.activate(targetLang);
  setI18nGlobal(i18n);
  return targetLang;
}
