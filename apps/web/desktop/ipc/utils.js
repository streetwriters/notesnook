/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

const { logger } = require("../logger");
const { app } = require("electron");
const path = require("path");

function sendMessageToRenderer(type, payload = {}) {
  const message = { type, ...payload };
  logger.info("Sending message to renderer", message);
  if (global.win) global.win.webContents.send("fromMain", message);
}

function resolvePath(_path) {
  if (path.isAbsolute(_path)) return _path;

  return path.join(
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

module.exports = { resolvePath, sendMessageToRenderer };
