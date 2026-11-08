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

import type { ThemeMetadata } from "../dialogs/theme-details-dialog";

export const THEME_SERVER_URL = "https://themes-api.notesnook.com";

type ThemeFilter =
  | { type: "term"; value: string }
  | { type: "colorScheme"; value: "dark" | "light" };

export type ThemesPage = {
  themes: ThemeMetadata[];
  nextCursor?: number | null;
};

async function query<T>(procedure: string, input: unknown): Promise<T> {
  const response = await fetch(
    `${THEME_SERVER_URL}/${procedure}?input=${encodeURIComponent(
      JSON.stringify(input)
    )}`
  );
  const json = await response.json();
  if (json.error) throw new Error(json.error.message || "Request failed");
  return json.result.data as T;
}

export const ThemesRouter = {
  themes: {
    query: (input: {
      limit: number;
      cursor?: number | null;
      compatibilityVersion: number;
      filters: ThemeFilter[];
    }) => query<ThemesPage>("themes", input)
  },
  installTheme: {
    query: (input: {
      id: string;
      compatibilityVersion: number;
      userId?: string;
    }) => query<unknown>("installTheme", input)
  }
};
