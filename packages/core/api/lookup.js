import * as fuzzysort from "fuzzysort";
import { qclone } from "qclone";
import { getContentFromData } from "../content-types";

export default class Lookup {
  /**
   *
   * @param {import('./index').default} db
   */
  constructor(db) {
    this._db = db;
  }

  async notes(notes, query) {
    notes = qclone(notes);
    const contents = await this._db.content.multi(
      notes.map((note) => note.contentId || "")
    );
    const candidates = notes.map((note) => {
      note.content = "";
      if (!note.locked) {
        let content = contents.find((content) => content.id === note.contentId);
        if (!content) return note;
        content = getContentFromData(content.type, content.data);
        note.content = content.toHTML();
      }
      return note;
    });
    return fzs(query, candidates, ["title", "content"]);
  }

  notebooks(array, query) {
    return fzs(query, array, ["title", "description"]);
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
    return fzs(query, array, ["title"]);
  }
}

function fzs(query, array, fields) {
  return fuzzysort
    .go(query, array, { allowTypo: true, keys: fields })
    .map((result) => result.obj);
}
