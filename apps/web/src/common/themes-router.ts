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

import type { ThemesRouter as ThemesRouterType } from "@notesnook/themes-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const THEME_SERVER_URL = "https://themes.notesnook.com";
export const ThemesRouter = createTRPCProxyClient<ThemesRouterType>({
  links: [
    httpBatchLink({
      url: THEME_SERVER_URL
    })
  ]
});
export const ThemesTRPC = createTRPCReact<ThemesRouterType>();
