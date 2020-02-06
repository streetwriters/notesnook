import CachedCollection from "../database/cached-collection";
import fuzzysearch from "fuzzysearch";
import Notebook from "../models/notebook";
import Notes from "./notes";
import Trash from "./trash";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}
export default class Notebooks {
  constructor(context) {
    this.context = context;
    this.collection = new CachedCollection(context, "notebooks");
    this.notes = undefined;
  }

  /**
   *
   * @param {Notes} notes
   * @param {Trash} trash
   */
  init(notes, trash) {
    this.notes = notes;
    this.trash = trash;
    return this.collection.init();
  }

  async add(notebookArg) {
    if (!notebookArg) throw new Error("Notebook cannot be undefined or null.");
    //TODO reliably and efficiently check for duplicates.
    const id = notebookArg.id || Date.now().toString() + "_notebook";
    let oldNotebook = this.collection.getItem(id);

    if (!oldNotebook && !notebookArg.title)
      throw new Error("Notebook must contain at least a title.");

    let notebook = {
      ...oldNotebook,
      ...notebookArg
    };

    notebook = {
      id,
      type: "notebook",
      title: notebook.title,
      description: notebook.description,
      dateCreated: notebook.dateCreated || Date.now(),
      dateEdited: Date.now(),
      pinned: !!notebook.pinned,
      favorite: !!notebook.favorite,
      topics: notebook.topics || [],
      totalNotes: 0
    };
    if (!oldNotebook) {
      notebook.topics.splice(0, 0, "General");
    }

    await this.collection.addItem(notebook);

    //if (!oldNotebook) {
    await this.notebook(notebook.id).topics.add(...notebook.topics);
    //}
    return notebook.id;
  }

  get all() {
    return this.collection.getAllItems();
  }

  notebook(id) {
    let notebook = this.collection.getItem(id);
    if (!notebook) return;
    return new Notebook(this, notebook);
  }

  async delete(...ids) {
    for (let id of ids) {
      let notebook = this.notebook(id);
      if (!notebook) continue;
      await this.collection.transaction(() =>
        notebook.topics.delete(...notebook.topics.all)
      );
      await this.collection.removeItem(id);
      await this.trash.add(notebook.data);
    }
  }

  filter(query) {
    if (!query) return [];
    return tfun.filter(v => fuzzysearch(query, v.title + " " + v.description))(
      this.all
    );
  }
}
