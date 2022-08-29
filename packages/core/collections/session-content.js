import { compress, decompress } from "../utils/compression";
import { makeSessionContentId } from "../utils/id";
import Collection from "./collection";

export default class SessionContent extends Collection {
  /**
   *
   * @param {string} sessionId
   * @param {{content:string:data:string}} content
   */
  async add(sessionId, content, locked) {
    if (!sessionId || !content) return;
    let compressed = locked ? null : compress(content.data);

    await this._collection.addItem({
      id: makeSessionContentId(sessionId),
      data: compressed || content.data,
      type: content.type,
      compressed: !!compressed,
      localOnly: true,
      locked,
    });
  }

  /**
   *
   * @param {string} sessionId
   * @returns {Promise<{content:string;data:string}>}
   */
  async get(sessionContentId) {
    if (!sessionContentId) return;
    let session = await this._collection.getItem(sessionContentId);
    return {
      data: session.compressed ? decompress(session.data) : session.data,
      type: session.type,
    };
  }

  /**
   *
   * @param {string} sessionContentId
   */
  async remove(sessionContentId) {
    await this._collection.deleteItem(sessionContentId);
  }

  async all() {
    let indices = await this._collection.indexer.getIndices();
    let items = await this._collection.getItems(indices);

    return Object.values(items);
  }
}
