import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import { groupArray } from "@streetwriters/notesnook-core/utils/grouping";

class TagStore extends BaseStore {
  tags = [];

  refresh = () => {
    this.set(
      (state) =>
        (state.tags = groupArray(
          db.tags.all,
          db.settings.getGroupOptions("tags")
        ))
    );
  };
}

/**
 * @type {[import("zustand").UseStore<TagStore>, TagStore]}
 */
const [useStore, store] = createStore(TagStore);
export { useStore, store };
