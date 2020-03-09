import fuzzysearch from "fuzzysearch";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Lookup {
  notes(array, query) {
    return tfun.filter(note =>
      fuzzysearch(query, note.title + " " + note.content.text)
    )(array);
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
