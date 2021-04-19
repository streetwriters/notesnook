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
    return notes.filter((note) => {
      let content = "";
      if (!note.locked) {
        content = contents.find((content) => content.id === note.contentId);
        if (!content) return false;
        content = getContentFromData(content.type, content.data);
        content = content.toHTML();
      }
      return search(query, note.title) || search(query, content);
    });
  }

  notebooks(array, query) {
    return array.filter(
      (item) => search(query, item.title) || search(query, item.description)
    );
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
    return array.filter((item) => search(query, item.title));
  }
}

function search(query, string) {
  const words = query.toLowerCase().split(" ");
  return words.some((word) => string.toLowerCase().indexOf(word) > -1);
}
