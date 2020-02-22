import CachedCollection from "../database/cached-collection";
import Notes from "./notes";
import Notebooks from "./notebooks";
import Storage from "../database/storage";
export default class Trash {
  constructor(context) {
    this._collection = new CachedCollection(context, "trash");
    this._deltaStorage = new Storage(context);
  }

  /**
   *
   * @param {Notes} notes
   * @param {Notebooks} notebooks
   */
  async init(notes, notebooks) {
    this._notes = notes;
    this._notebooks = notebooks;
    await this._collection.init();
  }

  get all() {
    return this._collection.getAllItems();
  }

  async add(item) {
    if (this._collection.exists(item.id + "_deleted"))
      throw new Error("This item has already been deleted.");
    item.dateDeleted = Date.now();
    item.id = item.id + "_deleted";
    await this._collection.addItem(item);
  }

  async delete(...ids) {
    for (let id of ids) {
      if (!this._collection.exists(id)) return;
      if (id.indexOf("note") > -1)
        await this._deltaStorage.remove(id.replace("_deleted", "") + "_delta");
      await this._collection.removeItem(id);
    }
  }

  async restore(...ids) {
    for (let id of ids) {
      let item = this._collection.getItem(id);
      if (!item) continue;
      delete item.dateDeleted;
      item.id = item.id.replace("_deleted", "");
      if (item.type === "note") {
        let { notebook } = item;
        item.notebook = {};
        await this._notes.add(item);

        if (notebook && notebook.id && notebook.topic) {
          const { id, topic } = notebook;

          // if the notebook has been deleted
          if (!this._notebooks._collection.exists(id)) {
            notebook = {};
          } else {
            // if the topic has been deleted
            if (!this._notebooks.notebook(id).topics.has(topic)) {
              notebook = {};
            }
          }

          // restore the note to the topic it was in before deletion
          if (notebook.id && notebook.topic) {
            await this._notebooks
              .notebook(id)
              .topics.topic(topic)
              .add(item.id);
          }
        }
      } else {
        const { topics } = item;
        item.topics = [];
        await this._notebooks.add(item);
        let notebook = this._notebooks.notebook(item.id);
        for (let topic of topics) {
          await notebook.topics.add(topic.title || topic);
          let t = notebook.topics.topic(topic.title || topic);
          if (!t) continue;
          if (topic.notes) await t.add(...topic.notes);
        }
      }
      await this._collection.removeItem(id);
    }
  }

  async clear() {
    let indices = await this._collection.indexer.getIndices();
    return this.delete(...indices);
  }
}
