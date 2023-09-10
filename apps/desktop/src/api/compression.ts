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
import zlib from "node:zlib";
import utils from "node:util";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

const gzipAsync = utils.promisify(zlib.gzip);
const gunzipAsync = utils.promisify(zlib.gunzip);

export const compressionRouter = t.router({
  gzip: t.procedure
    .input(z.object({ data: z.string(), level: z.number() }))
    .query(async ({ input }) => {
      const { data, level } = input;
      return (await gzipAsync(data, { level })).toString("base64");
    }),
  gunzip: t.procedure.input(z.string()).query(async ({ input }) => {
    return (await gunzipAsync(Buffer.from(input, "base64"))).toString("utf-8");
  })
});
