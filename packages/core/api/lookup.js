import fuzzysearch from "fuzzysearch";
import { getContentFromData } from "../content-types";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Lookup {
  /**
   *
   * @param {import('./index').default} db
   */
  constructor(db) {
    this._db = db;
  }

  async notes(notes, query) {
    const deltas = await this._db.content.multi(
      notes.map((note) => note.contentId)
    );
    const results = [];
    notes.forEach((note) => {
      const title = note.title;
      if (!note.locked) {
        let content = deltas.find((delta) => delta.id === note.contentId);
        content = getContentFromData(content.type, content.data);
        if (fzs(query, title) || content.search(query)) results.push(note);
      } else {
        if (fzs(query, title)) results.push(note);
      }
    });
    return results;
  }

  notebooks(array, query) {
    return tfun.filter(
      (nb) =>
        fzs(query, nb.title + " " + nb.description) ||
        nb.topics.some((topic) => fuzzysearch(query, topic.title))
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
    return tfun.filter((item) => fzs(query, item.title))(array);
  }
}

function fzs(query, text) {
  return fuzzysearch(query.toLowerCase(), text.toLowerCase());
}
