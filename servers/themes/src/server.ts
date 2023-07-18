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
import { ThemesAPI } from "./api";
import { syncThemes } from "./sync";
import cors from "cors";

const server = createHTTPServer({
  middleware: cors(),
  router: ThemesAPI
});
const PORT = parseInt(process.env.PORT || "9000");
server.listen(PORT);
console.log(`Server started successfully on: http://localhost:${PORT}/`);

syncThemes();

if (import.meta.hot) {
  import.meta.hot.on("vite:beforeFullReload", () => {
    server.server.close();
  });
}
