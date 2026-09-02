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
export { localeMap };

export function resolveTargetLocale(
  savedLanguage?: string | null,
  systemLocale?: string
): string {
  if (
    savedLanguage &&
    AVAILABLE_LANGUAGES.some((l) => l.code === savedLanguage)
  ) {
    return savedLanguage;
  }

  let sysLocale = systemLocale;
  if (!sysLocale) {
    try {
      sysLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
      sysLocale = "en";
    }
  }

  return getSupportedLocale(sysLocale);
}

export async function getLocaleMessages(lang: string): Promise<Messages> {
  const loader = localeMap[lang] || localeMap.en;
  const mod = await loader();
  const messages = "default" in mod ? mod.default.messages : (mod as { messages: unknown }).messages;
  return messages as unknown as Messages;
}

export type InitLocaleOptions = {
  getSavedLocale?: () => string | null | undefined;
  onSaveLocale?: (locale: string) => void;
  systemLocale?: string;
  getMessages?: (lang: string) => Promise<Messages> | Messages;
};

export async function initLocale(options?: InitLocaleOptions): Promise<string> {
  const saved = options?.getSavedLocale?.();
  const targetLang = resolveTargetLocale(saved, options?.systemLocale);
  if (!saved && options?.onSaveLocale) {
    options.onSaveLocale(targetLang);
  }

  const messages = options?.getMessages
    ? await options.getMessages(targetLang)
    : await getLocaleMessages(targetLang);

  defaultI18n.load({ [targetLang]: messages });
  defaultI18n.activate(targetLang);
  setI18nGlobal(defaultI18n);
  return targetLang;
}
