import CachedCollection from "../database/cached-collection";
import Notes from "./notes";
import Notebooks from "./notebooks";
import Content from "./content";
import getId from "../utils/id";
import { get7DayTimestamp } from "../utils/date";

export default class Trash {
  constructor(context) {
    this._collection = new CachedCollection(context, "trash");
  }

  /**
   *
   * @param {Notes} notes
   * @param {Notebooks} notebooks
   * @param {Content} delta
   * @param {Content} text
   */
  async init(notes, notebooks, delta, text) {
    this._notes = notes;
    this._notebooks = notebooks;
    this._deltaCollection = delta;
    this._textCollection = text;
    await this._collection.init();
    await this.cleanup();
  }

  async cleanup() {
    const sevenDayPreviousTimestamp = Date.now() - get7DayTimestamp();
    this.all.forEach(async item => {
      if (item.dateDeleted < sevenDayPreviousTimestamp) {
        await this.delete(item.id);
      }
    });
  }

  get all() {
    return this._collection.getAllItems(u => u.dateDeleted);
  }

  async add(item) {
    await this._collection.addItem({
      ...item,
      id: getId(),
      itemId: item.id,
      dateDeleted: Date.now()
    });
  }

  async delete(...ids) {
    for (let id of ids) {
      if (!id) continue;
      let item = this._collection.getItem(id);
      if (!item) continue;
      if (item.type === "note") {
        await this._deltaCollection.remove(item.content.delta);
        await this._textCollection.remove(item.content.text);
      }
      await this._collection.removeItem(id);
    }
  }

  async restore(...ids) {
    for (let id of ids) {
      let item = { ...this._collection.getItem(id) };
      if (!item) continue;
      delete item.dateDeleted;
      delete item.id;
      item.id = item.itemId;
      delete item.itemId;
      if (item.type === "note") {
        let { notebook } = item;
        item.notebook = {};
        await this._notes.add(item);

        if (notebook && notebook.id && notebook.topic) {
          const { id, topic } = notebook;

          // if the notebook or topic has been deleted
          if (
            !this._notebooks._collection.exists(id) ||
            !this._notebooks.notebook(id).topics.has(topic)
          ) {
            notebook = {};
          }

          // restore the note to the topic it was in before deletion
          if (notebook.id && notebook.topic) {
            await this._notebooks
              .notebook(id)
              .topics.topic(topic)
              .add(item.id);
          }
        }
      } else if (item.type === "notebook") {
        const { topics } = item;
        item.topics = [];
        await this._notebooks.add(item);
        let notebook = this._notebooks.notebook(item.id);
        for (let topic of topics) {
          await notebook.topics.add(topic.title);
          let t = notebook.topics.topic(topic.title);
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
