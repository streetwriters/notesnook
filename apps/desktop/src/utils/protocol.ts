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

import { net, protocol } from "electron";
import { isDevelopment } from "./index";
import { createReadStream } from "fs";
import { extname, normalize } from "path";
import { URL } from "url";

const BASE_PATH = isDevelopment() ? "../public" : "";
const HOSTNAME = `app.notesnook.com`;
const SCHEME = "https";
const extensionToMimeType: Record<string, string> = {
  html: "text/html",
  json: "application/json",
  js: "application/javascript",
  css: "text/css",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpg",
  ttf: "font/ttf",
  woff: "font/woff",
  woff2: "font/woff2"
};

function registerProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);
    if (shouldInterceptRequest(url)) {
      console.info("Intercepting request:", request.url);
      const loadIndex = !extname(url.pathname);
      const filePath = normalize(
        `${__dirname}${
          loadIndex ? `${BASE_PATH}/index.html` : `${BASE_PATH}/${url.pathname}`
        }`
      );
      if (!filePath) {
        console.error("Local asset file not found at", filePath);
        return new Response(undefined, {
          status: 404,
          statusText: "FILE_NOT_FOUND"
        });
      }
      const fileExtension = extname(filePath).replace(".", "");
      return new Response(createReadStream(filePath), {
        headers: { "Content-Type": extensionToMimeType[fileExtension] }
      });
    } else {
      return net.fetch(request, { bypassCustomProtocolHandlers: true });
    }
  });
  console.info(`${SCHEME} protocol inteception "successful"`);
}

const bypassedRoutes: string[] = [];
function shouldInterceptRequest(url: URL) {
  const shouldIntercept = url.hostname === HOSTNAME;
  return shouldIntercept && !bypassedRoutes.includes(url.pathname);
}

const PROTOCOL_URL = `${SCHEME}://${HOSTNAME}/`;
export { registerProtocol, PROTOCOL_URL };
