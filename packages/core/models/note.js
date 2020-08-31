import Converter from "../utils/converter";
import MarkdownBuilder from "../utils/templates/markdown/builder";
import HTMLBuilder from "../utils/templates/html/builder";
import TextBuilder from "../utils/templates/text/builder";

export default class Note {
  /**
   *
   * @param {import('../api').default} db
   * @param {Object} note
   */
  constructor(note, db) {
    this._note = note;
    this._db = db;
  }

  get data() {
    return this._note;
  }

  get headline() {
    return this._note.headline;
  }

  get title() {
    return this._note.title;
  }

  get tags() {
    return this._note.tags;
  }

  get colors() {
    return this._note.colors;
  }

  get id() {
    return this._note.id;
  }

  get notebook() {
    return this._note.notebook;
  }

  get dateEdited() {
    return this._note.dateEdited;
  }

  /**
   *
   * @param {"html"|"md"|"txt"} format - Format to export into
   */
  async export(to = "html") {
    const templateData = {
      metadata: this.data,
      title: this.title,
      editedOn: this.dateEdited,
      createdOn: this.data.dateCreated,
    };
    switch (to) {
      case "html":
        templateData.content = Converter.deltaToHTML(await this.delta());
        return HTMLBuilder.buildHTML(templateData);
      case "txt":
        templateData.content = await this.text();
        return TextBuilder.buildText(templateData);
      case "md":
        templateData.content = Converter.deltaToMD(await this.delta());
        return MarkdownBuilder.buildMarkdown(templateData);
      default:
        throw new Error("Export format not supported.");
    }
  }

  delta() {
    return this._db.delta.get(this._note.content.delta);
  }

  text() {
    return this._db.text.get(this._note.content.text);
  }

  color(color) {
    return addTag.call(this, color, "colors");
  }
  uncolor(color) {
    return removeTag.call(this, color, "colors");
  }

  tag(tag) {
    return addTag.call(this, tag, "tags");
  }
  untag(tag) {
    return removeTag.call(this, tag, "tags");
  }

  _toggle(prop) {
    return this._db.notes.add({ id: this._note.id, [prop]: !this._note[prop] });
  }

  favorite() {
    return this._toggle("favorite");
  }

  pin() {
    return this._toggle("pinned");
  }
}

async function addTag(tag, array) {
  if (this._note[array].indexOf(tag) > -1)
    throw new Error("Cannot add a duplicate tag.");
  let arr = [...this._note[array], tag];
  const note = { ...this._note, [array]: arr };
  await this._db[array].add(tag, note.id);
  await this._db.notes._collection.addItem(note);
}

async function removeTag(tag, array) {
  if (this._note[array].indexOf(tag) <= -1)
    throw new Error("This note is not tagged by the specified tag.");
  let arr = [...this._note[array]];
  arr.splice(arr.indexOf(tag), 1);
  const note = { ...this._note, [array]: arr };
  await this._db[array].remove(tag, note.id);
  await this._db.notes._collection.addItem(note);
}
