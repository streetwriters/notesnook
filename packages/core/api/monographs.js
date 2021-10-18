import http from "../utils/http";
import Constants from "../utils/constants";

class Monographs {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this.monographs = [];
  }

  async deinit() {
    this.monographs = [];
    await this._db.storage.write("monographs", this.monographs);
  }

  async init() {
    const user = await this._db.user.getUser();
    const token = await this._db.user.tokenManager.getAccessToken();
    if (!user || !token || !user.isEmailConfirmed) return;
    let monographs = await this._db.storage.read("monographs", true);
    try {
      monographs = await http.get(`${Constants.API_HOST}/monographs`, token);
      await this._db.storage.write("monographs", monographs);
    } catch (e) {
      console.error(e);
    }
    if (!!monographs) this.monographs = monographs;
  }

  /**
   * Check if note is published.
   * @param {string} noteId id of the note
   * @returns {boolean} Whether note is published or not.
   */
  isPublished(noteId) {
    return this.monographs.indexOf(noteId) > -1;
  }

  /**
   * Get note published monograph id
   * @param {string} noteId id of the note
   * @returns Monograph Id
   */
  monograph(noteId) {
    return this.monographs[this.monographs.indexOf(noteId)];
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
      id: noteId,
      title: note.title,
      userId: user.id,
      selfDestruct: opts.selfDestruct,
    };

    if (opts.password) {
      monograph.encryptedContent = await this._db.storage.encrypt(
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

    this.monographs.push(id);
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

    if (!this.isPublished(noteId))
      throw new Error("This note is not published.");

    await http.delete(`${Constants.API_HOST}/monographs/${noteId}`, token);

    this.monographs.splice(this.monographs.indexOf(noteId), 1);
  }

  get all() {
    return this._db.notes.all.filter(
      (note) => this.monographs.indexOf(note.id) > -1
    );
  }
}
export default Monographs;
