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

import { protocol } from "electron";
import { isDevelopment, getPath } from "./utils";
import { createReadStream } from "fs";
import { extname, normalize } from "path";
import { logger } from "./logger";
import { URL } from "url";

const FILE_NOT_FOUND = -6;
const BASE_PATH = isDevelopment() ? "../public" : "";
const HOSTNAME = `app.notesnook.com`;
const PROTOCOL = "https";
const extensionToMimeType = {
  html: "text/html",
  json: "application/json",
  js: "application/javascript",
  css: "text/css",
  svg: "image/svg+xml",
  png: "image/png"
};

function registerProtocol() {
  const protocolInterceptionResult = protocol.interceptStreamProtocol(
    PROTOCOL,
    async (request, callback) => {
      const url = new URL(request.url);
      if (shouldInterceptRequest(url)) {
        logger.info("Intercepting request:", request);

        const loadIndex = !extname(url.pathname);
        const absoluteFilePath = normalize(
          `${__dirname}${
            loadIndex
              ? `${BASE_PATH}/index.html`
              : `${BASE_PATH}/${url.pathname}`
          }`
        );
        const filePath = getPath(absoluteFilePath);
        if (!filePath) {
          logger.error("Local asset file not found at", filePath);
          callback({ error: FILE_NOT_FOUND });
          return;
        }
        const fileExtension = extname(filePath).replace(".", "");

        const data = createReadStream(filePath);
        callback({
          data,
          mimeType: extensionToMimeType[fileExtension]
        });
      } else {
        protocol.uninterceptProtocol(PROTOCOL);
      }
    }
  );

  logger.info(
    `${PROTOCOL} protocol inteception ${
      protocolInterceptionResult ? "successful" : "failed"
    }.`
  );
}

const bypassedRoutes = [];
function shouldInterceptRequest(url) {
  let shouldIntercept = url.hostname === HOSTNAME;
  return shouldIntercept && !bypassedRoutes.includes(url.pathname);
}

const PROTOCOL_URL = `${PROTOCOL}://${HOSTNAME}/`;
export { registerProtocol, PROTOCOL_URL };
