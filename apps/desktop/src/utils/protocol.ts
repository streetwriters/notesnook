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

import { protocol, ProtocolRequest } from "electron";
import { isDevelopment } from "./index";
import { createReadStream, statSync } from "fs";
import { extname, join, normalize } from "path";
import { URL } from "url";
import { Readable } from "stream";

const BASE_PATH = isDevelopment() ? "../public" : "";
const HOSTNAME = `app.notesnook.com`;
const FILE_NOT_FOUND = -6;
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
  const protocolInterceptionResult = protocol.interceptStreamProtocol(
    SCHEME,
    async (request, callback) => {
      const url = new URL(request.url);
      if (shouldInterceptRequest(url)) {
        console.info("Intercepting request:", request.url);

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
          console.error("Local asset file not found at", filePath);
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
        let response: Response;
        try {
          const body = await getBody(request);
          response = await fetch(request.url, {
            ...request,
            body,
            headers: {
              ...request.headers
              // origin: `${PROTOCOL}://${HOSTNAME}/`
            },
            referrer: request.referrer,
            redirect: "manual"
          });
        } catch (e) {
          console.error(e);
          console.error(`Error sending request to `, request.url, "Error: ", e);
          callback({ statusCode: 400 });
          return;
        }
        callback({
          statusCode: response.status,
          data: response.body ? Readable.fromWeb(response.body) : undefined,
          headers: Object.fromEntries(response.headers.entries()),
          mimeType: response.headers.get("Content-Type") || undefined
        });
      }
    }
  );

  console.info(
    `${SCHEME} protocol inteception ${
      protocolInterceptionResult ? "successful" : "failed"
    }.`
  );

  // protocol.handle(SCHEME, (request) => {
  //   const url = new URL(request.url);
  //   if (shouldInterceptRequest(url)) {
  //     console.info("Intercepting request:", request.url);
  //     const loadIndex = !extname(url.pathname);
  //     const absoluteFilePath = normalize(
  //       `${__dirname}${
  //         loadIndex ? `${BASE_PATH}/index.html` : `${BASE_PATH}/${url.pathname}`
  //       }`
  //     );
  //     const filePath = getPath(absoluteFilePath);
  //     if (!filePath) {
  //       console.error("Local asset file not found at", filePath);
  //       return new Response(undefined, {
  //         status: 404,
  //         statusText: "FILE_NOT_FOUND"
  //       });
  //     }
  //     const fileExtension = extname(filePath).replace(".", "");
  //     const data = createReadStream(filePath);
  //     return new Response(data, {
  //       headers: { "Content-Type": extensionToMimeType[fileExtension] }
  //     });
  //   } else {
  //     return net.fetch(request);
  //   }
  // });
  // console.info(`${SCHEME} protocol inteception "successful"`);
}

const bypassedRoutes: string[] = [];
function shouldInterceptRequest(url: URL) {
  const shouldIntercept = url.hostname === HOSTNAME;
  return shouldIntercept && !bypassedRoutes.includes(url.pathname);
}

const PROTOCOL_URL = `${SCHEME}://${HOSTNAME}/`;
export { registerProtocol, PROTOCOL_URL };

async function getBody(request: ProtocolRequest) {
  const session = globalThis?.window?.webContents?.session;

  const blobParts = [];
  if (!request.uploadData || !request.uploadData.length) return null;
  for (const data of request.uploadData) {
    if (data.bytes) {
      blobParts.push(new Uint8Array(data.bytes));
    } else if (session && data.blobUUID) {
      const buffer = await session.getBlobData(data.blobUUID);
      if (!buffer) continue;
      blobParts.push(new Uint8Array(buffer));
    }
  }
  const blob = new Blob(blobParts);
  return await blob.arrayBuffer();
}

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
