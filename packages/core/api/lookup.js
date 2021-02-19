import { search } from "fast-fuzzy";
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
    return search(query, candidates, {
      keySelector: (item) => [item.title, item.content],
      ignoreCase: false,
    });
  }

  notebooks(array, query) {
    return search(query, array, {
      keySelector: (item) => {
        return [
          item.title,
          item.description || "",
          ...item.topics.map((t) => t.title),
        ];
      },
      ignoreCase: true,
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
    return search(query, array, {
      keySelector: (item) => item.title || "",
      ignoreCase: true,
    });
  }
}
