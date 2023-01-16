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

import { AppEventManager } from "../common/app-events";
import { isDesktop } from "../utils/platform";

export function invokeCommand(type, payload = {}) {
  if (!isDesktop()) return;

  window.api.send("fromRenderer", {
    type,
    ...payload
  });
}

if (isDesktop()) {
  window.api.receive("fromMain", (args) => {
    console.log(args);
    const { type } = args;
    AppEventManager.publish(type, args);
  });
}
