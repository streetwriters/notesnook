class Settings {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this._settings = { pins: [] };
  }

  async init() {
    this._settings =
      (await this._db.context.read("settings")) || this._settings;
  }

  async pin(type, data) {
    if (type !== "notebook" && type !== "topic" && type !== "tag")
      throw new Error("This item cannot be pinned.");
    if (this.isPinned(data.id)) return;
    this._settings.pins.push({ type, data });
    await this._db.context.write("settings", this._settings);
  }

  async unpin(id) {
    const index = this._settings.pins.findIndex((i) => i.data.id === id);
    if (index <= -1) return;
    this._settings.pins.splice(index, 1);
    await this._db.context.write("settings", this._settings);
  }

  isPinned(id) {
    return this.Settings.pins.findIndex((v) => v.data.id === id) > -1;
  }

  get pins() {
    return this._settings.pins.map((pin) => {
      if (pin.type === "notebook") {
        return this._db.notebooks.notebook(pin.data.id).data;
      } else if (pin.type === "topic") {
        return this._db.notebooks
          .notebook(pin.data.notebookId)
          .topics.topic(pin.data.topic)._topic;
      } else if (pin.type === "tag") {
        return this._db.tags.tag(pin.data.id);
      }
    });
  }
}
export default Settings;
