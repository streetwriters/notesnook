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
    /* if (notebookArg.topics) {
      notebook.topics = [...notebook.topics, ...notebookArg.topics];
    } */
    if (oldNotebook && oldNotebook.topics) {
      notebook.topics = [...notebook.topics, ...oldNotebook.topics];
    }

    let topics =
      notebook.topics.filter((v, i) => notebook.topics.indexOf(v) === i) || [];
    if (!oldNotebook) {
      topics[0] = makeTopic("General", id);
    }

    for (let i = 0; i < topics.length; i++) {
      let topic = topics[i];

      let isEmpty =
        !topic || (typeof topic === "string" && topic.trim().length <= 0);

      if (isEmpty) {
        topics.splice(i, 1);
        i--;
        continue;
      }

      if (typeof topic === "string") {
        topics[i] = makeTopic(topic, id);
      }
    }

    notebook = {
      id,
      type: "notebook",
      title: notebook.title,
      description: notebook.description,
      dateCreated: notebook.dateCreated || Date.now(),
      dateEdited: Date.now(),
      pinned: !!notebook.pinned,
      favorite: !!notebook.favorite,
      topics,
      totalNotes: 0
    };

    await this.collection.addItem(notebook);
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

function makeTopic(topic, notebookId) {
  return {
    type: "topic",
    notebookId,
    title: topic,
    id: Date.now(),
    dateCreated: Date.now(),
    totalNotes: 0,
    notes: []
  };
}
