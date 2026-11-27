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

// The few browser globals the app code shared with apps/web calls, backed by
// the platform services. Imported after the platform is set up.

import { shell } from "@platform";

type WebWindow = { open?: (url?: string | URL, target?: string) => null };

export function installWebGlobals(target: object = globalThis) {
  const scope = target as { window?: WebWindow };
  const window = (scope.window ??= scope as WebWindow);
  // `window.open(url, "_blank")` opens the link in the user's browser.
  window.open ??= (url) => {
    if (url) shell.openUrl(String(url));
    return null;
  };
}

installWebGlobals();
