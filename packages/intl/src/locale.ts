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

import { i18n as defaultI18n, type Messages } from "@lingui/core";
import { setI18nGlobal } from "./setup";
import { AVAILABLE_LANGUAGES, getSupportedLocale } from "./languages";
import { localeMap } from "./generated/locale-map";
import { LOCALE_LOADERS } from "./generated/loaders.mobile";

export function resolveTargetLocale(
  savedLanguage: string | null | undefined,
  systemLocale: string
): string {
  if (
    savedLanguage &&
    AVAILABLE_LANGUAGES.some((l) => l.code === savedLanguage)
  ) {
    return savedLanguage;
  }

  return getSupportedLocale(systemLocale);
}

const localeCache: Record<string, Messages> = {};
const localeCatalogs: Record<string, Messages> = {};

for (const locale of Object.keys(LOCALE_LOADERS)) {
  Object.defineProperty(localeCatalogs, locale, {
    enumerable: true,
    get() {
      if (!localeCache[locale]) {
        localeCache[locale] = (
          LOCALE_LOADERS as Record<string, () => Messages>
        )[locale]();
      }
      return localeCache[locale];
    }
  });
}

async function getLocaleMessages(lang: string): Promise<Messages> {
  const loader = localeMap[lang];
  const mod = await loader();
  return ("default" in mod ? mod.default.messages : mod.messages) as Messages;
}

export type InitLocaleOptions = {
  getSavedLocale?: () => string | null | undefined;
  onSaveLocale?: (locale: string) => void;
  systemLocale: string;
};

export type InitLocaleSyncOptions = InitLocaleOptions;

function resolveAndSaveLocale(options: InitLocaleOptions): string {
  const saved = options.getSavedLocale?.();
  const targetLang = resolveTargetLocale(saved, options.systemLocale);
  if (!saved && options.onSaveLocale) {
    options.onSaveLocale(targetLang);
  }
  return targetLang;
}

function activateLocale(targetLang: string) {
  defaultI18n.activate(targetLang);
  setI18nGlobal(defaultI18n);
}

export function initLocaleSync(options: InitLocaleOptions): string {
  const targetLang = resolveAndSaveLocale(options);
  defaultI18n.load(localeCatalogs);
  activateLocale(targetLang);
  return targetLang;
}

export async function initLocale(options: InitLocaleOptions): Promise<string> {
  const targetLang = resolveAndSaveLocale(options);
  const messages = await getLocaleMessages(targetLang);
  defaultI18n.load({ [targetLang]: messages });
  activateLocale(targetLang);
  return targetLang;
}
