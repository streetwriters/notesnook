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

export type Language = {
  code: string;
  label: string;
  nativeLabel: string;
};

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "pl", label: "Polish", nativeLabel: "Polski" },
  { code: "pt-BR", label: "Portuguese (Brazil)", nativeLabel: "Português (Brasil)" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "uk", label: "Ukrainian", nativeLabel: "Українська" }
];

/**
 * Resolves a BCP-47 locale tag to the closest available catalog.
 *
 * Matching is done in order of specificity so that region-qualified
 * catalogs work correctly:
 *   1. exact match          — "pt-BR" -> "pt-BR"
 *   2. base language match  — "en-GB" -> "en"
 *   3. regional fallback    — "pt", "pt-PT" -> "pt-BR"
 * Anything unrecognized falls back to "en".
 */
export function getSupportedLocale(locale?: string): string {
  if (!locale) return "en";

  const normalized = locale.replace(/_/g, "-").toLowerCase();
  const base = normalized.split("-")[0];

  const exact = AVAILABLE_LANGUAGES.find(
    (l) => l.code.toLowerCase() === normalized
  );
  if (exact) return exact.code;

  const baseMatch = AVAILABLE_LANGUAGES.find(
    (l) => l.code.toLowerCase() === base
  );
  if (baseMatch) return baseMatch.code;

  const regionalMatch = AVAILABLE_LANGUAGES.find(
    (l) => l.code.toLowerCase().split("-")[0] === base
  );
  return regionalMatch ? regionalMatch.code : "en";
}
