import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import { store as notestore } from "./note-store";

class TagStore extends BaseStore {
  monographs = [];

  refresh = () => {
    this.set((state) => (state.monographs = db.monographs.all));
  };

  publish = async (noteId, opts) => {
    const publishId = await db.monographs.publish(noteId, opts);
    this.get().refresh();
    notestore.refreshContext();
    return publishId;
  };

  unpublish = async (noteId) => {
    await db.monographs.unpublish(noteId);
    this.get().refresh();
    notestore.refreshContext();
  };
}

/**
 * @type {[import("zustand").UseStore<TagStore>, TagStore]}
 */
const [useStore, store] = createStore(TagStore);
export { useStore, store };
