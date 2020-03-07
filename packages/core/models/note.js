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

  get text() {
    return this._note.content.text;
  }

  delta() {
    return this._notes._deltaStorage.read(this._note.id + "_delta");
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

  async _lock(password) {
    let delta = qclone(await this.delta());
    if (delta) {
      delta = await this._notes._collection.indexer.encrypt(
        password,
        JSON.stringify(delta)
      );
      await this._notes._deltaStorage.write(this._note.id + "_delta", delta);
    }
    const note = { ...this._note };
    note.content = await this._notes._collection.indexer.encrypt(
      password,
      JSON.stringify(this._note.content)
    );
    note.locked = true;
    return await this._notes._collection.addItem(note);
  }

  async _unlock(password, perm = false) {
    let decrypted = JSON.parse(
      await this._notes._collection.indexer.decrypt(
        password,
        this._note.content
      )
    );
    let delta = JSON.parse(
      await this._notes._collection.indexer.decrypt(
        password,
        await this.delta()
      )
    );
    if (perm) {
      const note = { ...this._note, locked: false, content: decrypted };
      note.locked = false;
      note.content = decrypted;
      await this._notes._collection.addItem(note);
      await this._notes._deltaStorage.write(note.id + "_delta", delta);
    }
    return {
      ...this._note,
      content: { ...decrypted, delta }
    };
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
