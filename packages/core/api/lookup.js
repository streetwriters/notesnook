import fuzzysearch from "fuzzysearch";
import sm from "../utils/set";
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
    return sm.union(
      this._db.content._collection.search.search(query, {
        map: (elem) => {
          return notes.find((note) => note.contentId === elem);
        },
      }),
      this._db.notes._collection.search.search(query)
    );
  }

  notebooks(array, query) {
    return this._db.notebooks._collection.search.search(query, {
      map: (elem) => {
        return array.find((nb) => nb.id === elem);
      },
    });
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
