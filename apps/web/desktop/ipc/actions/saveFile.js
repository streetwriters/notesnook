const { app } = require("electron");
const fs = require("fs");
const path = require("path");

module.exports = (args) => {
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
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, data);
};
