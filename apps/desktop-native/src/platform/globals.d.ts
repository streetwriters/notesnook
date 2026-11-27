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

// Build-time globals that code shared with apps/web reads as bare names (web
// declares them in apps/web/src/global.d.ts and defines them in its Vite
// config). Each target sets them: the web target through vite.config.web.ts's
// `define`, the desktop target in src/targets/desktop/globals.ts, unit tests
// in vitest.unit.config.ts.
declare var IS_TESTING: boolean;
