import Notebooks from "../collections/notebooks";
import Topics from "../collections/topics";

export default class Notebook {
  /**
   *
   * @param {Notebooks} notebooks
   * @param {Object} notebook
   */
  constructor(notebooks, notebook) {
    this._notebook = notebook;
    this._notebooks = notebooks;
  }

  get title() {
    return this._notebook.title;
  }

  get data() {
    return this._notebook;
  }

  get topics() {
    return new Topics(this._notebooks, this._notebook.id);
  }

  _toggle(prop) {
    return this._notebooks.add({
      id: this._notebook.id,
      [prop]: !this._notebook[prop]
    });
  }

  pin() {
    return this._toggle("pinned");
  }
}
