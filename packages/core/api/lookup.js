import { filter, parse } from "liqe";

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

    return search(notes, query, (note) => {
      let text = note.title;
      if (
        !note.locked &&
        !!note.contentId &&
        contents.hasOwnProperty(note.contentId)
      )
        text += contents[note.contentId]["data"];
      return text;
    });
  }

  notebooks(array, query) {
    return search(array, query, (n) => `${n.title} ${n.description}`);
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
    return search(array, query, (n) => n.title);
  }
}

function search(items, query, selector) {
  try {
    return filter(
      parse(`text:"${query.toLowerCase()}"`),
      items.map((item) => {
        return { item, text: selector(item).toLowerCase() };
      })
    ).map((v) => v.item);
  } catch (e) {
    return [];
  }
}
