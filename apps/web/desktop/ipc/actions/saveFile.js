const fs = require("fs");
const path = require("path");
const { logger } = require("../../logger");
const { resolvePath } = require("../utils");

module.exports = (args) => {
  try {
    const { data, filePath } = args;
    if (!data || !filePath) return;

    const resolvedPath = resolvePath(filePath);

    logger.info("Saving file to", resolvedPath);

    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, data);

    logger.info("File saved to", resolvedPath);
  } catch (e) {
    logger.error("Could not save file.", e);
  }
};
