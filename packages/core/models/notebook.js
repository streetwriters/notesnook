import Notebooks from "../collections/notebooks";
import Topics from "../collections/topics";

export default class Notebook {
  /**
   *
   * @param {Notebooks} notebooks
   * @param {Object} notebook
   */
  constructor(notebooks, notebook) {
    this.notebook = notebook;
    this.notebooks = notebooks;
  }

  get title() {
    return this.notebook.title;
  }

  get data() {
    return this.notebook;
  }

  get topics() {
    return new Topics(this.notebooks, this.notebooks.notes, this.notebook.id);
  }

  toggle(prop) {
    this.notebook[prop] = !this.notebook[prop];
    return this.notebooks.add(this.notebook);
  }

  pin() {
    return this.toggle("pinned");
  }

  favorite() {
    return this.toggle("favorite");
  }
}
