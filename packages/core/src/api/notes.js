class Store {
  constructor(storage) {
    this.storage = storage;
    this.collection = new Map();
  }
}

export default class Notes extends Store {
  //get notes(): INote[] {}
  async addNote(note) {
    if (this.isNoteEmpty(note)) {
      return this.deleteNotes(note.id);
    }

    note.dateCreated = note.dateCreated || Date.now();
    note.id = note.id || note.dateCreated.toString();
    note.type = ModelType.note;
    note.dateEdited = Date.now();
    note.title = this.getNoteTitle(note);
    note.headline = this.getNoteHeadline(note);

    if (this.collection.has(note.id)) {
      note = this.mergeNote(note);
    }

    this.collection.set(note.id, note);
    return this.storage.write(note.id, note);
  }

  getNote(id) {
    return this.collection.get(id);
  }

  deleteNotes(...ids) {
    for (let id in ids) {
      if (this.collection.delete(id)) {
        this.storage.remove(id);
      }
    }
  }

  isNoteEmpty(note) {
    return (
      this.collection.has(note.id) &&
      !note.locked &&
      note.title?.length <= 0 &&
      note.content.text?.length <= 0
    );
  }

  getNoteTitle(note) {
    return (
      note.title ||
      note.content.text
        .split(" ")
        .slice(0, 3)
        .join(" ")
    );
  }

  getNoteHeadline(note) {
    return (
      !note.locked &&
      note.content.text.substring(0, 150) +
        (note.content.text.length > 150 ? "..." : "")
    );
  }

  mergeNote(note) {
    return { ...this.collection.get(note.id), ...note };
  }
}
