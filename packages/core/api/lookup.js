import { Fzf } from "fzf";

export default class Lookup {
  /**
   *
   * @param {import('./index').default} db
   */
  constructor(db) {
    this._db = db;
  }

  async notes(notes, query) {
    const contents = await this._db.content.multi(
      notes.map((note) => note.contentId || "")
    );

    const items = [];
    for (let i = 0; i < notes.length; ++i) {
      const note = notes[i];
      const item = { note, text: note.title };
      items.push(item);
      if (
        !note.locked &&
        !!note.contentId &&
        contents.hasOwnProperty(note.contentId)
      )
        item.text += " " + contents[note.contentId]["data"];
    }

    return new Fzf(items, {
      selector: (v) => v.text,
      normalize: false,
    })
      .find(query)
      .map((v) => v.item.note);
  }

  notebooks(array, query) {
    return new Fzf(array, {
      selector: (n) => `${n.title} ${n.description}`,
    })
      .find(query)
      .map((v) => v.item);
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
    return new Fzf(array, {
      selector: (n) => n.title,
    })
      .find(query)
      .map((v) => v.item);
  }
}
