import Notes from "../collections/notes";

export default class Note {
  /**
   *
   * @param {Notes} notes
   * @param {Object} note
   */
  constructor(notes, note) {
    this.note = note;
    this.notes = notes;
  }

  get data() {
    return this.note;
  }

  get headline() {
    return this.note.headline;
  }

  get title() {
    return this.note.title;
  }

  get tags() {
    return this.note.tags;
  }

  get colors() {
    return this.note.colors;
  }

  get id() {
    return this.note.id;
  }

  get notebook() {
    return this.note.notebook;
  }

  get text() {
    return this.note.content.text;
  }

  delta() {
    return this.notes.deltaStorage.read(this.note.id + "_delta");
  }

  color(color) {
    return addTag.call(this, color, "colorsCollection", "colors");
  }
  uncolor(color) {
    return removeTag.call(this, color, "colorsCollection", "colors");
  }

  tag(tag) {
    return addTag.call(this, tag, "tagsCollection", "tags");
  }
  untag(tag) {
    return removeTag.call(this, tag, "tagsCollection", "tags");
  }

  async save() {
    await this.notes.add(this.note);
    return this;
  }

  toggle(prop) {
    this.note[prop] = !this.note[prop];
    return this.save();
  }

  favorite() {
    return this.toggle("favorite");
  }

  pin() {
    return this.toggle("pinned");
  }

  async lock(password) {
    this.note.content = await this.notes.collection.indexer.encrypt(
      password,
      JSON.stringify(this.note.content)
    );
    this.note.locked = true;
    return await this.notes.collection.addItem(this.note);
  }

  async unlock(password, perm = false) {
    let decrypted = await this.notes.collection.indexer.decrypt(
      password,
      this.note.content
    );
    if (perm) {
      this.note.locked = false;
      this.note.content = JSON.parse(decrypted);
      await this.notes.collection.addItem(this.note);
    }
    return { ...this.note, content: JSON.parse(decrypted) };
  }
}

async function addTag(tag, collection, array) {
  if (this.note[array].indexOf(tag) > -1)
    throw new Error("Cannot add a duplicate tag.");
  this.note[array].push(tag);
  await this.notes[collection].add(tag);
  await this.notes.collection.addItem(this.note);
}

async function removeTag(tag, collection, array) {
  if (this.note[array].indexOf(tag) <= -1)
    throw new Error("This note is not tagged by the specified tag.");
  this.note[array].splice(this.note[array].indexOf(tag), 1);
  await this.notes[collection].remove(tag);
  await this.notes.collection.addItem(this.note);
}
