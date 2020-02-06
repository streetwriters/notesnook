import CachedCollection from "../database/cached-collection";
import Notes from "./notes";
import Notebooks from "./notebooks";
import Storage from "../database/storage";
export default class Trash {
  constructor(context) {
    this.collection = new CachedCollection(context, "trash");
    this.deltaStorage = new Storage(context);
  }

  /**
   *
   * @param {Notes} notes
   * @param {Notebooks} notebooks
   */
  async init(notes, notebooks) {
    this.notes = notes;
    this.notebooks = notebooks;
    await this.collection.init();
  }

  get all() {
    return this.collection.getAllItems();
  }

  async add(item) {
    if (this.collection.exists(item.id + "_deleted"))
      throw new Error("This item has already been deleted.");
    item.dateDeleted = Date.now();
    item.id = item.id + "_deleted";
    await this.collection.addItem(item);
  }

  async delete(...ids) {
    for (let id of ids) {
      if (!this.collection.exists(id)) return;
      if (id.indexOf("note") > -1)
        this.deltaStorage.remove(id.replace("_deleted", "") + "_delta");
      await this.collection.removeItem(id);
    }
  }

  async restore(...ids) {
    for (let id of ids) {
      let item = this.collection.getItem(id);
      if (!item) continue;
      delete item.dateDeleted;
      item.id = item.id.replace("_deleted", "");
      if (item.type === "note") {
        let { notebook } = item;
        item.notebook = {};
        await this.notes.add(item);

        if (notebook && notebook.id && notebook.topic) {
          const { id, topic } = notebook;

          // if the notebook has been deleted
          if (!this.notebooks.collection.exists(id)) {
            notebook = {};
          } else {
            // if the topic has been deleted
            if (!this.notebooks.notebook(id).topics.exists(topic)) {
              notebook = {};
            }
          }

          // restore the note to the topic it was in before deletion
          if (notebook.id && notebook.topic) {
            await this.notebooks
              .notebook(id)
              .topics.topic(topic)
              .add(item.id);
          }
        }
      } else {
        const { topics } = item;
        item.topics = [];
        await this.notebooks.add(item);
        let notebook = this.notebooks.notebook(item.id);
        for (let topic of topics) {
          await notebook.topics.add(topic.title || topic);
          let t = notebook.topics.topic(topic.title || topic);
          if (!t) continue;
          if (topic.notes) await t.add(...topic.notes);
        }
      }
      await this.collection.removeItem(id);
    }
  }

  async clear() {
    let indices = await this.collection.indexer.getIndices();
    return this.delete(...indices);
  }
}
