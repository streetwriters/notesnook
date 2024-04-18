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

import { initTRPC } from "@trpc/server";
import { compressionRouter } from "./compression";
import { osIntegrationRouter } from "./os-integration";
import { spellCheckerRouter } from "./spell-checker";
import { updaterRouter } from "./updater";
import { bridgeRouter } from "./bridge";
import { safeStorageRouter } from "./safe-storage";
import { windowRouter } from "./window";

const t = initTRPC.create();

export const router = t.router({
  compress: compressionRouter,
  integration: osIntegrationRouter,
  spellChecker: spellCheckerRouter,
  updater: updaterRouter,
  bridge: bridgeRouter,
  safeStorage: safeStorageRouter,
  window: windowRouter
});

export const api = router.createCaller({});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof router;
