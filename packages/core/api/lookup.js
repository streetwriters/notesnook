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

  async notes(array, query) {
    const textIds = array.map(v => v.content.text);
    const textArray = await this._db.text.multi(textIds);
    console.log(textArray, textIds);
    const filteredText = tfun.filter(text => fuzzysearch(query, text.data))(
      textArray
    );
    const filteredByText = filteredText.map(text =>
      array.find(note => note.id === text.noteId)
    );
    const filteredByTitle = tfun.filter(note => fuzzysearch(query, note.title))(
      array
    );
    return set.union(filteredByText, filteredByTitle);
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
