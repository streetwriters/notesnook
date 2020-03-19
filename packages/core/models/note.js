import Notes from "../collections/notes";
import { qclone } from "qclone";

export default class Note {
  /**
   *
   * @param {Notes} notes
   * @param {Object} note
   */
  constructor(notes, note) {
    this._note = note;
    this._notes = notes;
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

  delta() {
    return this._notes._deltaCollection.get(this._note.content.delta);
  }

  text() {
    return this._notes._textCollection.get(this._note.content.text);
  }

  color(color) {
    return addTag.call(this, color, "_colorsCollection", "colors");
  }
  uncolor(color) {
    return removeTag.call(this, color, "_colorsCollection", "colors");
  }

  tag(tag) {
    return addTag.call(this, tag, "_tagsCollection", "tags");
  }
  untag(tag) {
    return removeTag.call(this, tag, "_tagsCollection", "tags");
  }

  _toggle(prop) {
    return this._notes.add({ id: this._note.id, [prop]: !this._note[prop] });
  }

  favorite() {
    return this._toggle("favorite");
  }

  pin() {
    return this._toggle("pinned");
  }
}

async function addTag(tag, collection, array) {
  if (this._note[array].indexOf(tag) > -1)
    throw new Error("Cannot add a duplicate tag.");
  let arr = [...this._note[array], tag];
  const note = { ...this._note, [array]: arr };
  await this._notes[collection].add(tag);
  await this._notes._collection.addItem(note);
}

async function removeTag(tag, collection, array) {
  if (this._note[array].indexOf(tag) <= -1)
    throw new Error("This note is not tagged by the specified tag.");
  let arr = [...this._note[array]];
  arr.splice(arr.indexOf(tag), 1);
  const note = { ...this._note, [array]: arr };
  await this._notes[collection].remove(tag);
  await this._notes._collection.addItem(note);
}
