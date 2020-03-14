import createStore from "../common/store";
import { db } from "../common";
import { showPasswordDialog } from "../components/dialogs/passworddialog";

function tagStore(set, get) {
  return {
    tags: [],
    refreshTags: function() {
      set(state => {
        state.tags = db.tags.all;
      });
    }
  };
}

const [useStore, store] = createStore(tagStore);

export { useStore, store };
