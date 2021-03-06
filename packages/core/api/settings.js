import { EV, EVENTS } from "../common";
import id from "../utils/id";
import setManipulator from "../utils/set";

class Settings {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this._settings = {
      type: "settings",
      id: id(),
      pins: [],
      dateEdited: Date.now(),
      dateCreated: Date.now(),
    };
  }

  get raw() {
    return this._settings;
  }

  async merge(item) {
    // TODO if (this.settings.dateEdited > (await this._db.lastSynced())) {
    //   this._settings.pins = setManipulator.union(
    //     this._settings.pins,
    //     item.pins
    //   );
    // }
    this._settings = item;
    await this._db.context.write("settings", item);
  }

  async init() {
    var settings = await this._db.context.read("settings");
    if (settings) this._settings = settings;
    EV.subscribe(EVENTS.userLoggedOut, () => {
      this._settings = undefined;
      this._settings = {
        type: "settings",
        id: id(),
        pins: [],
        dateEdited: 0,
        dateCreated: 0,
      };
    });
  }

  async pin(type, data) {
    if (type !== "notebook" && type !== "topic" && type !== "tag")
      throw new Error("This item cannot be pinned.");
    if (this.isPinned(data.id)) return;
    this._settings.pins.push({ type, data });
    this._settings.dateEdited = Date.now();
    await this._db.context.write("settings", this._settings);
  }

  async unpin(id) {
    const index = this._settings.pins.findIndex((i) => i.data.id === id);
    if (index <= -1) return;
    this._settings.pins.splice(index, 1);
    this._settings.dateEdited = Date.now();
    await this._db.context.write("settings", this._settings);
  }

  isPinned(id) {
    return this._settings.pins.findIndex((v) => v.data.id === id) > -1;
  }

  get pins() {
    return this._settings.pins.reduce((prev, pin) => {
      let item;
      if (pin.type === "notebook") {
        item = this._db.notebooks.notebook(pin.data.id).data;
      } else if (pin.type === "topic") {
        item = this._db.notebooks
          .notebook(pin.data.notebookId)
          .topics.topic(pin.data.id)._topic;
      } else if (pin.type === "tag") {
        item = this._db.tags.tag(pin.data.id);
      }
      if (item) prev.push(item);
      else this.unpin(pin.data.id); // TODO risky.
      return prev;
    }, []);
  }
}
export default Settings;
