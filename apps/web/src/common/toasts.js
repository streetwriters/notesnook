import { db } from ".";
import { store as notestore } from "../stores/note-store";
import { store as nbstore } from "../stores/notebook-store";
import { showToast } from "../utils/toast";

function showNotesMovedToast(note, noteIds, notebook) {
  let actions;

  const newNotebook = db.notebooks.notebook(notebook.id);
  let verb =
    noteIds.length > 1 ? "added" : note.notebook?.id ? "moved" : "added";
  let messageText = noteIds.length > 1 ? `${noteIds.length} notes` : "Note";
  messageText += ` ${verb} to "${newNotebook.title}"`;

  if (noteIds.length === 1) {
    const undoAction = async () => {
      toast.hide();
      if (note.notebook?.id) {
        db.notes.move(note.notebook, note.id);
        const notebook = db.notebooks.notebook(note.notebook.id);
        showToast("success", `Note moved back to "${notebook.title}"`);
      } else {
        await newNotebook.topics.topic(notebook.topic).delete(note.id);
        showToast("success", `Note removed from "${newNotebook.title}"`);
      }
    };
    actions = [{ text: "Undo", onClick: undoAction }];
  }
  var toast = showToast("success", messageText, actions);
}

function showNoteDeleted(note) {
  const undoAction = async () => {
    await db.trash.restore(note);
  };

  let actions = [{ text: "Undo", onClick: undoAction }];

  showToast("success", "Note Deleted", actions);
}

function showNoteColored(colors, label) {
  if (colors.includes(label)) {
    showToast("success", "Untagged as " + label);
  } else {
    showToast("success", "Tagged as " + label);
  }
}

async function showUnpinnedToast(itemId, itemType) {
  const noun = itemType === "note" ? "Note" : "Notebook";
  const messageText = `${noun} unpinned successfully!`;
  const undoAction = async () => {
    toast.hide();
    if (itemType === "note") await notestore.pin(itemId);
    else if (itemType === "notebook") await nbstore.pin(itemId);
  };
  let actions = [{ text: "Undo", onClick: undoAction }];
  var toast = showToast("success", messageText, actions);
}

export {
  showNotesMovedToast,
  showNoteDeleted,
  showNoteColored,
  showUnpinnedToast,
};
