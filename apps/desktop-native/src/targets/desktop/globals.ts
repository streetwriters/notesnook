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

// The build-time globals declared in src/platform/globals.d.ts (apps/web
// defines them in its Vite config). The native host has no build-time define,
// so they are set here from the environment service, before any app module
// runs: index.js imports this first.
import { environment } from "./platform/environment";

globalThis.IS_TESTING = environment.isTesting;
