import { db } from "./db";
import { store as notestore } from "../stores/note-store";
import { store as nbstore } from "../stores/notebook-store";
import { showToast } from "../utils/toast";

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

function showItemDeletedToast(item) {
  const noun = item.type === "note" ? "Note" : "Notebook";
  const messageText = `${noun} deleted successfully!`;
  const undoAction = async () => {
    toast.hide();
    let trashItem = db.trash.all.find((i) => i.id === item.id);
    if (!trashItem) return;
    await db.trash.restore(trashItem.id);
    nbstore.refresh();
    notestore.refresh();
  };
  let actions = [{ text: "Undo", onClick: undoAction }];
  var toast = showToast("success", messageText, actions);
}

async function showUndoableToast(message, onAction, onPermanentAction, onUndo) {
  await onAction();
  const timeoutId = setTimeout(onPermanentAction, 5000);
  const undoAction = async () => {
    clearTimeout(timeoutId);
    toast.hide();
    onUndo();
  };
  let actions = [{ text: "Undo", onClick: undoAction }];
  var toast = showToast("success", message, actions);
}

export { showUnpinnedToast, showItemDeletedToast, showUndoableToast };
