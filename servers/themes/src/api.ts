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

import { z } from "zod";
import { InstallsCounter } from "./constants";
import { findTheme, getThemes } from "./orama";
import { syncThemes } from "./sync";
import { publicProcedure, router } from "./trpc";
import { THEME_COMPATIBILITY_VERSION } from "@notesnook/theme";
import { ThemeQuerySchema } from "./schemas";

export const ThemesAPI = router({
  themes: publicProcedure.input(ThemeQuerySchema).query(async ({ input }) => {
    return getThemes(input);
  }),
  installTheme: publicProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string().optional(),
        compatibilityVersion: z.number().default(THEME_COMPATIBILITY_VERSION)
      })
    )
    .query(async ({ input: { compatibilityVersion, id, userId } }) => {
      const theme = await findTheme(id, compatibilityVersion);
      if (!theme) return;

      if (userId) await InstallsCounter.increment(theme.id, userId);
      return theme;
    }),
  updateTheme: publicProcedure
    .input(
      z.object({
        id: z.string(),
        version: z.number(),
        compatibilityVersion: z.number()
      })
    )
    .query(async ({ input: { id, version, compatibilityVersion } }) => {
      const theme = await findTheme(id, compatibilityVersion);
      if (theme && theme.version !== version) return theme;
    }),
  sync: publicProcedure.query(() => {
    syncThemes();
    return true;
  }),
  health: publicProcedure.query(() => {
    return "Healthy";
  })
});
