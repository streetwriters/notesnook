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
    if (type !== "notebook" || type !== "topic" || type !== "tag")
      throw new Error("This item cannot be pinned.");
    this._settings.pins.push({ id, data });
    await this._db.context.write("settings", this._settings);
  }

  async unpin(id) {
    const index = this._settings.pins.findIndex((i) => i.id === id);
    if (index <= -1) return;
    this._settings.pins.splice(index, 1);
    await this._db.context.write("settings", this._settings);
  }

  get pins() {
    return this._settings.pins.map((pin) => {
      if (pin.type === "notebook") {
        return this._db.notebooks.notebook(pin.data.id).data;
      } else if (pin.type === "topic") {
        return this._db.notebooks
          .notebook(pin.data.id)
          .topics.topic(pin.data.topic)._topic;
      } else if (pin.type === "tag") {
        return this._db.tags.tag(pin.data.id);
      }
    });
  }
}
