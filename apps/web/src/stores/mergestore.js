import createStore from "../common/store";
import { db } from "../common";
import { store as noteStore } from "./note-store";
import { store as editorStore } from "./editor-store";
import EditorNavigator from "../navigation/navigators/editornavigator";
import BaseStore from "./index";

class MergeStore extends BaseStore {
  conflictedNote;
  localDelta;
  remoteDelta;

  openConflict = async (note) => {
    noteStore.setSelectedNote(note.id);
    const delta = await db.delta.raw(note.content.delta);
    this.set((state) => {
      state.conflictedNote = note;
      state.localDelta = { ...delta, conflicted: false };
      state.remoteDelta = delta.conflicted;
    });
    EditorNavigator.navigate("split");
  };

  resolveConflict = async (selectedContent, otherContent) => {
    const note = this.get().conflictedNote;
    selectedContent.delta = {
      data: { ops: selectedContent.delta },
      resolved: true,
    };
    await db.notes.add({
      id: note.id,
      content: selectedContent,
      conflicted: false,
    });
    if (otherContent) {
      otherContent.delta = {
        data: { ops: otherContent.delta },
      };
      await db.notes.add({
        ...note,
        content: otherContent,
        id: undefined,
        dateCreated: undefined,
        dateEdited: undefined,
        title: note.title + " (DUPLICATE)",
      });
    }
    this.set((state) => {
      state.conflictedNote = undefined;
      state.localDelta = undefined;
      state.remoteDelta = undefined;
    });
    noteStore.refresh();
    noteStore.setSelectedNote(note.id);
    await editorStore.openSession(note.id);
  };
}

const [useStore, store] = createStore(MergeStore);
export { useStore, store };
