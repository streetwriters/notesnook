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

  notes(notes, query) {
    return new Promise((resolve) => {
      const results = [];
      let index = 0,
        max = notes.length;
      notes.forEach(async (note) => {
        const title = note.title;
        if (!note.locked) {
          let content = await this._db.content.raw(note.contentId);
          content = getContentFromData(content.type, content.data);
          if (content.search(query) || fzs(query, title)) results.push(note);
        } else {
          if (fzs(query, title)) results.push(note);
        }
        if (++index >= max) return resolve(results);
      });
    });
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
