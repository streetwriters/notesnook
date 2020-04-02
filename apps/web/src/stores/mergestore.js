import createStore from "../common/store";
import { db } from "../common";
import Navigators from "../navigation/navigators";
import BaseStore from "./index";

class MergeStore extends BaseStore {
  conflictedNote;
  localDelta;
  remoteDelta;

  openConflict = async note => {
    const delta = await db.delta.raw(note.content.delta);
    this.set(state => {
      state.conflictedNote = note;
      state.localDelta = { ...delta, conflicted: false };
      state.remoteDelta = delta.conflicted;
    });
    Navigators.EditorNavigator.navigate("split");
  };
}

const [useStore, store] = createStore(MergeStore);
export { useStore, store };
