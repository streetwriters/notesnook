import MarkdownBuilder from "../utils/templates/markdown/builder";
import HTMLBuilder from "../utils/templates/html/builder";
import TextBuilder from "../utils/templates/text/builder";
import { getContentFromData } from "../content-types";
import { CHECK_IDS, sendCheckUserStatusEvent } from "../common";

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

  get notebooks() {
    return this._note.notebooks;
  }

  get dateEdited() {
    return this._note.dateEdited;
  }

  /**
   *
   * @param {"html"|"md"|"txt"} format - Format to export into
   * @param {string?} rawContent - Use this raw content instead of generating itself
   */
  async export(to = "html", rawContent) {
    const templateData = {
      metadata: this.data,
      title: this.title,
      editedOn: this.dateEdited,
      createdOn: this.data.dateCreated,
    };
    const { data, type } = await this._db.content.raw(this._note.contentId);
    let content = getContentFromData(type, data);

    if (to !== "txt" && !(await sendCheckUserStatusEvent(CHECK_IDS.noteExport)))
      return;

    switch (to) {
      case "html":
        templateData.content = rawContent || content.toHTML();
        return HTMLBuilder.buildHTML(templateData);
      case "txt":
        templateData.content = rawContent || content.toTXT();
        return TextBuilder.buildText(templateData);
      case "md":
        templateData.content = rawContent || content.toMD();
        return MarkdownBuilder.buildMarkdown(templateData);
      default:
        throw new Error("Export format not supported.");
    }
  }

  content() {
    return this._db.content.get(this._note.contentId);
  }

  async color(color) {
    if (!(await sendCheckUserStatusEvent(CHECK_IDS.noteColor))) return;
    await this.uncolor();
    let tag = await this._db.colors.add(color, this._note.id);
    await this._db.notes._collection.addItem({
      ...this._note,
      color: tag.title,
    });
  }

  async uncolor() {
    if (!this._note.color) return;
    await this._db.colors.remove(this._note.color, this._note.id);
    await this._db.notes._collection.addItem({
      ...this._note,
      color: undefined,
    });
  }

  async tag(tag) {
    if (
      this._db.tags.all.length >= 5 &&
      !(await sendCheckUserStatusEvent(CHECK_IDS.noteTag))
    )
      return;
    return await addTag.call(this, tag);
  }

  untag(tag) {
    return removeTag.call(this, tag);
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

async function addTag(tag) {
  if (this._note.tags.indexOf(tag) > -1)
    throw new Error("Cannot add a duplicate tag.");
  let tagItem = await this._db.tags.add(tag, this._note.id);
  let arr = [...this._note.tags, tagItem.title];
  const note = { ...this._note, tags: arr };
  await this._db.notes._collection.addItem(note);
}

async function removeTag(tag) {
  if (this._note.tags.indexOf(tag) <= -1)
    throw new Error("This note is not tagged by the specified tag.");
  let arr = [...this._note.tags];
  arr.splice(arr.indexOf(tag), 1);
  const note = { ...this._note, tags: arr };
  await this._db.tags.remove(tag, note.id);
  await this._db.notes._collection.addItem(note);
}
