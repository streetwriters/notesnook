import fuzzysearch from "fuzzysearch";
import Database from "./index";
import set from "../utils/set";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Lookup {
  /**
   *
   * @param {Database} db
   */
  constructor(db) {
    this._db = db;
  }

  notes(notes, query) {
    return new Promise(resolve => {
      const results = [];
      let index = 0,
        max = notes.length;
      notes.forEach(async note => {
        const text = await this._db.text.get(note.content.text);
        const title = note.title;
        if (fuzzysearch(query, text + title)) results.push(note);
        if (++index >= max) return resolve(results);
      });
    });
  }

  notebooks(array, query) {
    return tfun.filter(
      nb =>
        fuzzysearch(query, nb.title + " " + nb.description) ||
        nb.topics.some(topic => fuzzysearch(query, topic.title))
    )(array);
  }

  topics(array, query) {
    return this._byTitle(array, query);
  }

  tags(array, query) {
    return this._byTitle(array, query);
  }

  trash(array, query) {
    return this._byTitle(array, query);
  }

  _byTitle(array, query) {
    return tfun.filter(item => fuzzysearch(query, item.title))(array);
  }
}
