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

import { app } from "electron";
import { JSONStorage } from "./json-storage";
import {
  setI18nGlobal,
  AVAILABLE_LANGUAGES,
  getSupportedLocale
} from "@notesnook/intl";
import { i18n, type Messages } from "@lingui/core";

const localeMap: Record<
  string,
  () => Promise<{ default: { messages: unknown } }>
> = {
  en: () => import("@notesnook/intl/locales/$en.json"),
  de: () => import("@notesnook/intl/locales/$de.json"),
  es: () => import("@notesnook/intl/locales/$es.json"),
  fr: () => import("@notesnook/intl/locales/$fr.json"),
  it: () => import("@notesnook/intl/locales/$it.json"),
  nl: () => import("@notesnook/intl/locales/$nl.json"),
  pl: () => import("@notesnook/intl/locales/$pl.json"),
  "pt-BR": () => import("@notesnook/intl/locales/$pt-BR.json"),
  ru: () => import("@notesnook/intl/locales/$ru.json"),
  tr: () => import("@notesnook/intl/locales/$tr.json"),
  uk: () => import("@notesnook/intl/locales/$uk.json")
};

function resolveTargetLang(): string {
  const savedLanguage = JSONStorage.get<string>("appLanguage", "");
  if (
    savedLanguage &&
    AVAILABLE_LANGUAGES.some((l) => l.code === savedLanguage)
  ) {
    return savedLanguage;
  }

  const systemLocale = app.getLocale() || "en";
  const detected = getSupportedLocale(systemLocale);
  JSONStorage.set("appLanguage", detected);
  return detected;
}

async function getLocaleMessages(lang: string): Promise<Messages> {
  const loader = localeMap[lang] || localeMap.en;
  const mod = await loader();
  return mod.default.messages as unknown as Messages;
}

export async function initLocale() {
  const targetLang = resolveTargetLang();
  const messages = await getLocaleMessages(targetLang);
  i18n.load({ [targetLang]: messages });
  i18n.activate(targetLang);
  setI18nGlobal(i18n as any);
  return targetLang;
}
