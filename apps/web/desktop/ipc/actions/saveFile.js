const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const { logger } = require("../../logger");

module.exports = (args) => {
  try {
    const { data, filePath } = args;
    if (!data || !filePath) return;

    const resolvedPath = path.join(
      ...filePath.split("/").map((segment) => {
        let resolved = segment;
        try {
          resolved = app.getPath(resolved);
        } finally {
          return resolved;
        }
      })
    );

    logger.info("Saving file to", resolvedPath);

    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, data);

    logger.info("File saved to", resolvedPath);
  } catch (e) {
    logger.error("Could not save file.", e);
  }
};
