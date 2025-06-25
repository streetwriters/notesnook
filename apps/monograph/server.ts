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

// This server file is used to serve the Remix app in production using Bun.
// run it like so: npm run build; cd output; bun install; bun run start
// Running it directly will give an error.
import type { ServerBuild } from "@remix-run/server-runtime";
import { createRequestHandler } from "@remix-run/server-runtime";
import { resolve } from "node:path";
// @ts-expect-error server is not built yet
import * as build from "./build/server/index";
import { type Serve } from "bun";

const remix = createRequestHandler(
  build as unknown as ServerBuild,
  Bun.env.NODE_ENV
);
process.env.PORT = process.env.PORT || "3000";

export default {
  port: process.env.PORT,
  async fetch(request) {
    // First we need to send handle static files
    const { pathname } = new URL(request.url);
    const file = Bun.file(
      resolve(__dirname, "./build/client/", `.${pathname}`)
    );
    if (await file.exists()) return new Response(file);
    // Only if a file doesn't exists we send the request to the Remix request handler
    return remix(request);
  }
} satisfies Serve;
