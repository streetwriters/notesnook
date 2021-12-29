import Topics from "../collections/topics";

export default class Notebook {
  /**
   *
   * @param {Object} notebook
   * @param {import ('../api').default} db
   */
  constructor(notebook, db) {
    this._notebook = notebook;
    this._db = db;
  }

  get totalNotes() {
    return this._notebook.topics.reduce((sum, topic) => {
      return sum + topic.notes.length;
    }, 0);
  }

  get title() {
    return this._notebook.title;
  }

  get data() {
    return this._notebook;
  }

  get topics() {
    return new Topics(this._notebook.id, this._db);
  }

  get dateEdited() {
    return this._notebook.dateEdited;
  }

  get dateModified() {
    return this._notebook.dateModified;
  }

  _toggle(prop) {
    return this._db.notebooks.add({
      id: this._notebook.id,
      [prop]: !this._notebook[prop],
    });
  }

  pin() {
    return this._toggle("pinned");
  }
}
