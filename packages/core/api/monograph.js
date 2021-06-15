import http from "../utils/http";
import Constants from "../utils/constants";

class Monograph {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this.monographs;
  }

  async init() {
    const user = await this._db.user.getUser();
    const token = await this._db.user.tokenManager.getAccessToken();
    if (!user || !token || !user.isEmailConfirmed) return;
    try {
      const userMonographs = await http.get(
        `${Constants.API_HOST}/monographs`,
        token
      );
      this.monographs = userMonographs.reduce((prev, curr) => {
        prev[curr.noteId] = curr.id;
        return prev;
      }, {});
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Check if note is published.
   * @param {string} noteId id of the note
   * @returns {boolean} Whether note is published or not.
   */
  async isPublished(noteId) {
    return !!this.monographs[noteId];
  }

  /**
   * Get note published monograph id
   * @param {string} noteId id of the note
   * @returns Monograph Id
   */
  async monograph(noteId) {
    return this.monographs[noteId];
  }

  /**
   * Publish a note as a monograph
   * @param {string} noteId id of the note to publish
   * @param {{password: string, selfDestruct: boolean}} opts Publish options
   * @returns
   */
  async publish(noteId, opts) {
    if (!this.monographs) await this.init();

    let update = !!this.isPublished(noteId);

    const user = await this._db.user.getUser();
    const token = await this._db.user.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = this._db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");

    const content = await this._db.content.raw(note.data.contentId);
    if (!content) throw new Error("This note has no content.");

    const monograph = {
      id: this.monographs[noteId],
      title: note.title,
      noteId: noteId,
      userId: user.id,
      selfDestruct: opts.selfDestruct,
    };

    if (opts.password) {
      monograph.encryptedContent = await this._db.context.encrypt(
        { password: opts.password },
        JSON.stringify({ type: content.type, data: content.data })
      );
    } else {
      monograph.content = JSON.stringify({
        type: content.type,
        data: content.data,
      });
    }

    const method = update ? http.patch.json : http.post.json;

    const { id } = await method(
      `${Constants.API_HOST}/monographs`,
      monograph,
      token
    );

    this.monographs[noteId] = id;
    return id;
  }

  /**
   * Unpublish a note
   * @param {string} noteId id of the note to unpublish
   */
  async unpublish(noteId) {
    if (!this.monographs) await this.init();

    const user = await this._db.user.getUser();
    const token = await this._db.user.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = this._db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");

    if (!this.monographs[noteId])
      throw new Error("This note is not published.");

    await http.delete(
      `${Constants.API_HOST}/monographs/${note.publishId}`,
      token
    );

    delete this.monographs[noteId];
  }
}
export default Monograph;
