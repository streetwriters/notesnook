const { protocol } = require("electron");
const { isDevelopment, getPath } = require("./utils");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch").default;

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
  png: "image/png",
};

function registerProtocol() {
  protocol.interceptStreamProtocol(
    PROTOCOL,
    async (request, callback) => {
      const url = new URL(request.url);
      if (url.hostname === HOSTNAME) {
        const absoluteFilePath = path.normalize(
          `${__dirname}${
            url.pathname === "/"
              ? `${BASE_PATH}/index.html`
              : `${BASE_PATH}/${url.pathname}`
          }`
        );
        const filePath = getPath(absoluteFilePath);
        if (!filePath) {
          callback({ error: FILE_NOT_FOUND });
          return;
        }
        const fileExtension = path.extname(filePath).replace(".", "");

        const data = fs.createReadStream(filePath);
        callback({
          data,
          mimeType: extensionToMimeType[fileExtension],
        });
      } else {
        const response = await fetch(request.url, {
          ...request,
          body: !!request.uploadData ? request.uploadData[0].bytes : null,
          headers: { ...request.headers, origin: `${PROTOCOL}://${HOSTNAME}/` },
          redirect: "manual",
        });
        callback({
          statusCode: response.status,
          data: response.body,
          headers: Object.fromEntries(response.headers.entries()),
          mimeType: response.headers.get("Content-Type"),
        });
      }
    },
    (err) => {
      if (err) console.error("Failed to register protocol");
    }
  );
}

module.exports = { registerProtocol, URL: `${PROTOCOL}://${HOSTNAME}/` };
