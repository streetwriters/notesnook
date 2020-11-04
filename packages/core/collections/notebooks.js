import Collection from "./collection";
import fuzzysearch from "fuzzysearch";
import Notebook from "../models/notebook";
import sort from "fast-sort";
import getId from "../utils/id";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Notebooks extends Collection {
  async add(notebookArg) {
    if (!notebookArg) throw new Error("Notebook cannot be undefined or null.");

    if (notebookArg.remote) {
      return await this._collection.addItem(notebookArg);
    }

    //TODO reliably and efficiently check for duplicates.
    const id = notebookArg.id || getId();
    let oldNotebook = this._collection.getItem(id);

    if (!oldNotebook && !notebookArg.title)
      throw new Error("Notebook must contain at least a title.");

    let notebook = {
      ...oldNotebook,
      ...notebookArg,
    };

    notebook = {
      id,
      type: "notebook",
      title: notebook.title,
      description: notebook.description,
      dateCreated: notebook.dateCreated,
      pinned: !!notebook.pinned,
      favorite: !!notebook.favorite,
      topics: notebook.topics || [],
      totalNotes: 0,
    };
    if (!oldNotebook) {
      notebook.topics.splice(0, 0, "General");
    }

    await this._collection.addItem(notebook);

    if (!oldNotebook) {
      await this.notebook(notebook).topics.add(...notebook.topics);
    }
    return id;
  }

  get raw() {
    return this._collection.getRaw();
  }

  get all() {
    return sort(this._collection.getItems()).desc((t) => t.pinned);
  }

  get pinned() {
    return tfun.filter(".pinned === true")(this.all);
  }

  /**
   *
   * @param {string} id The id of the notebook
   * @returns {Notebook} The notebook of the given id
   */
  notebook(id) {
    let notebook = id.type ? id : this._collection.getItem(id);
    if (!notebook) return;
    return new Notebook(notebook, this._db);
  }

  async delete(...ids) {
    for (let id of ids) {
      let notebook = this.notebook(id);
      if (!notebook) continue;
      await notebook.topics.delete(...notebook.data.topics);
      await this._collection.removeItem(id);
      await this._db.trash.add(notebook.data);
    }
  }

  filter(query) {
    if (!query) return [];
    let queryFn = (v) => fuzzysearch(query, v.title + " " + v.description);
    if (query instanceof Function) queryFn = query;
    return tfun.filter(queryFn)(this.all);
  }
}
