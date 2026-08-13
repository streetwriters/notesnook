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
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" }
];

export function getSupportedLocale(locale?: string): string {
  if (!locale) return "en";
  const lang = locale.split("-")[0].toLowerCase();
  const found = AVAILABLE_LANGUAGES.find((l) => l.code === lang);
  return found ? found.code : "en";
}
