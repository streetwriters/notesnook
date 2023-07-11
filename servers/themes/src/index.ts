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
import { ThemeDefinition } from "@notesnook/theme";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { THEME_METADATA_JSON } from "./constants";
import { getThemes } from "./orama";
import { getThemesMetadata, syncThemes } from "./sync";
import { publicProcedure, router } from "./trpc";
import ip from "ip";

const ThemesRouter = router({
  themes: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0)
      })
    )
    .query(async ({ input: { limit, cursor } }) => {
      return getThemes("", limit, cursor);
    }),
  getTheme: publicProcedure.input(z.string()).query(({ input }) => {
    const theme = getThemesMetadata().find((theme) => theme.id === input);
    if (theme) return theme as ThemeDefinition;

    return undefined;
  }),
  updateTheme: publicProcedure.input(z.string()).query(({ input }) => {
    const theme = getThemesMetadata().find(
      (theme) => theme.id === input
    ) as ThemeDefinition;
    if (theme) {
      return theme.version === input ? undefined : (theme as ThemeDefinition);
    }
    return undefined;
  }),
  search: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().default(0),
        query: z.string()
      })
    )
    .query(async ({ input: { query, cursor, limit } }) => {
      return getThemes(query, limit, cursor);
    }),
  sync: publicProcedure.query(() => {
    syncThemes();
    return true;
  })
});

export type ThemesRouter = typeof ThemesRouter;

const server = createHTTPServer({
  router: ThemesRouter
});
const PORT = 1000;
server.listen(PORT);
console.log(`Server started successfully on: http://${ip.address()}:${PORT}/ `);

Promise.resolve().then(() => {
  if (!fs.existsSync(path.join(__dirname, THEME_METADATA_JSON))) {
    fs.writeFileSync(THEME_METADATA_JSON, "{}");
  }
  syncThemes();
});
