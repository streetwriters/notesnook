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

  async tag(tag) {
    if (this.note.tags.indexOf(tag) > -1)
      throw new Error("Cannot add a duplicate tag.");
    this.note.tags.push(tag);
    await this.notes.tagsCollection.add(tag);
    await this.notes.collection.addItem(this.note);
  }

  async untag(tag) {
    if (this.note.tags.indexOf(tag) <= -1)
      throw new Error("This note is not tagged by the specified tag.");
    this.note.tags.splice(this.note.tags.indexOf(tag), 1);
    await this.notes.tagsCollection.remove(tag);
    await this.notes.collection.addItem(this.note);
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
