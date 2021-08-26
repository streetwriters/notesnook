const fs = require("fs");
const path = require("path");

function getFile(fileName) {
  let data = fs.readFileSync(path.join(__dirname, `fixtures/${fileName}`));

  return {
    data: data,
    fileName: fileName
  };
}

module.exports = {
  getFile
};
