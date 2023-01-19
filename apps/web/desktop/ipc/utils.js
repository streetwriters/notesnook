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

import { logger } from "../logger";
import { app } from "electron";
import { isAbsolute, join } from "path";

function sendMessageToRenderer(type, payload = {}) {
  const message = { type, ...payload };
  logger.info("Sending message to renderer", message);
  if (globalThis.window)
    globalThis.window.webContents.send("fromMain", message);
}

function resolvePath(_path) {
  if (isAbsolute(_path)) return _path;

  return join(
    ..._path.split("/").map((segment) => {
      let resolved = segment;
      try {
        resolved = app.getPath(resolved);
      } catch (e) {
        // ignore
      }
      return resolved;
    })
  );
}

export { resolvePath, sendMessageToRenderer };
