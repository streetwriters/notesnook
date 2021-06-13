import http from "../utils/http";
import Constants from "../utils/constants";

class Monograph {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
  }

  async publish(noteId, opts) {
    const user = await this._db.user.getUser();
    const token = await this._db.user.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = this._db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");

    const content = await this._db.content.raw(note.data.contentId);
    if (!content) throw new Error("This note has no content.");

    const monograph = {
      id: note.publishId,
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

    const method = opts.update ? http.patch.json : http.post.json;

    const { id } = await method(
      `${Constants.API_HOST}/monographs`,
      monograph,
      token
    );

    await this._db.notes.add({ id: note.id, publishId: id });
  }

  async unpublish(noteId) {
    const user = await this._db.user.getUser();
    const token = await this._db.user.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = this._db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");

    if (!note.publishId) throw new Error("This note is not published.");

    await http.delete(
      `${Constants.API_HOST}/monographs/${note.publishId}`,
      token
    );

    await this._db.notes.add({ id: note.id, publishId: undefined });
  }

  update(noteId, opts) {
    return this.publish(noteId, { ...opts, update: true });
  }
}
export default Monograph;
