/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
