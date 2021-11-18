const fs = require("fs");
const { app } = require("electron");
const path = require("path");

const directory = app.getPath("userData");
const filename = "config.json";
const filePath = path.join(directory, filename);
class JSONStorage {
  static get(key, def) {
    const json = this.readJson();
    return json[key] || def;
  }

  static set(key, value) {
    const json = this.readJson();
    json[key] = value;
    this.writeJson(json);
  }

  static clear() {
    this.writeJson({});
  }

  /**
   * @private
   */
  static readJson() {
    try {
      const json = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(json);
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  /**
   * @private
   */
  static writeJson(json) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(json));
    } catch (e) {
      console.error(e);
    }
  }
}
module.exports = JSONStorage;
