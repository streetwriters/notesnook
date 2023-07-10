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
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { THEME_METADATA_JSON } from "./constants";
import { getThemes } from "./orama";
import { syncThemes } from "./sync";
import { publicProcedure, router } from "./trpc";

if (!fs.existsSync(path.join(__dirname, THEME_METADATA_JSON))) {
  fs.writeFileSync(THEME_METADATA_JSON, "{}");
}

syncThemes();

const ThemesRouter = router({
  themes: publicProcedure
    .input(
      z.object({
        count: z.number(),
        offset: z.number()
      })
    )
    .query(async ({ input: { count, offset } }) => {
      return getThemes("", count, offset);
    }),
  search: publicProcedure
    .input(
      z.object({
        count: z.number(),
        offset: z.number(),
        query: z.string()
      })
    )
    .query(async ({ input: { query, offset, count } }) => {
      return getThemes(query, count, offset);
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

server.listen(1000);
