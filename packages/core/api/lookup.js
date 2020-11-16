import fuzzysearch from "fuzzysearch";
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
    let contentIds = this._db.content._collection.search.searchDocs(query);
    let noteIds = this._db.notes._collection.search.searchDocs(query);
    return notes.filter((note) => {
      return (
        contentIds.findIndex((content) => note.id === content.noteId) > -1 ||
        noteIds.findIndex((n) => n.id === note.id) > -1
      );
    });
  }

  notebooks(array, query) {
    const notebooksIds = this._db.notebooks._collection.search.searchDocs(
      query
    );
    return tfun.filter(
      (nb) => notebooksIds.findIndex((notebook) => notebook.id === nb.id) > -1
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
