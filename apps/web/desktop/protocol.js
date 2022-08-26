const { protocol } = require("electron");
const { isDevelopment, getPath } = require("./utils");
const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");
const { Blob } = require("buffer");

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

        const loadIndex = !path.extname(url.pathname);
        const absoluteFilePath = path.normalize(
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
        const fileExtension = path.extname(filePath).replace(".", "");

        const data = fs.createReadStream(filePath);
        callback({
          data,
          mimeType: extensionToMimeType[fileExtension]
        });
      } else {
        var response;
        try {
          const body = await getBody(request);
          response = await fetch(request.url, {
            ...request,
            body,
            headers: {
              ...request.headers,
              origin: `${PROTOCOL}://${HOSTNAME}/`
            },
            redirect: "manual"
          });
        } catch (e) {
          console.error(e);
          logger.error(`Error sending request to `, request.url, "Error: ", e);
          callback({ statusCode: 400 });
          return;
        }
        callback({
          statusCode: response.status,
          data: response.body,
          headers: Object.fromEntries(response.headers.entries()),
          mimeType: response.headers.get("Content-Type")
        });
      }
    }
  );

  logger.info(
    `${PROTOCOL} protocol inteception ${
      protocolInterceptionResult ? "successful" : "failed"
    }.`
  );
}

const bypassedRoutes = ["/notes/index_v14.json", "/notes/welcome-web"];
function shouldInterceptRequest(url) {
  let shouldIntercept = url.hostname === HOSTNAME;
  return shouldIntercept && !bypassedRoutes.includes(url.pathname);
}

/**
 *
 * @param {Electron.ProtocolRequest} request
 */
async function getBody(request) {
  /**
   * @type {Electron.Session}
   */
  const session = global.win.webContents.session;

  const blobParts = [];
  if (!request.uploadData || !request.uploadData.length) return null;
  for (let data of request.uploadData) {
    if (data.type === "rawData") {
      blobParts.push(new Uint8Array(data.bytes));
    } else if (data.type === "blob") {
      const buffer = await session.getBlobData(data.blobUUID);
      blobParts.push(new Uint8Array(buffer));
    }
  }
  const blob = new Blob(blobParts);
  return await blob.arrayBuffer();
}

module.exports = { registerProtocol, URL: `${PROTOCOL}://${HOSTNAME}/` };
