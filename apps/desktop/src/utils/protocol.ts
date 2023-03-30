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

import { protocol, net } from "electron";
import { isDevelopment } from "./index";
import { createReadStream, statSync } from "fs";
import { extname, join, normalize } from "path";
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
  png: "image/png"
};

function registerProtocol() {
  protocol.handle(SCHEME, (request) => {
    const url = new URL(request.url);
    if (shouldInterceptRequest(url)) {
      console.info("Intercepting request:", request);

      const loadIndex = !extname(url.pathname);
      const absoluteFilePath = normalize(
        `${__dirname}${
          loadIndex ? `${BASE_PATH}/index.html` : `${BASE_PATH}/${url.pathname}`
        }`
      );
      const filePath = getPath(absoluteFilePath);
      if (!filePath) {
        console.error("Local asset file not found at", filePath);
        return new Response(undefined, {
          status: 404,
          statusText: "FILE_NOT_FOUND"
        });
      }
      const fileExtension = extname(filePath).replace(".", "");
      const data = createReadStream(filePath);
      const headers = new Headers();
      headers.set("Content-Type", extensionToMimeType[fileExtension]);
      return new Response(data, { headers });
    } else {
      return net.fetch(request);
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

function getPath(filePath: string): string | undefined {
  try {
    const result = statSync(filePath);

    if (result.isFile()) {
      return filePath;
    }

    if (result.isDirectory()) {
      return getPath(join(filePath, "index.html"));
    }
  } catch (_) {
    // ignore
  }
}
