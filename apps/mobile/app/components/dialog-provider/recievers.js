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

import { eSendEvent } from "../../services/event-manager";
import {
  eCloseActionSheet,
  eCloseAddNotebookDialog,
  eCloseMoveNoteDialog,
  eOpenActionSheet,
  eOpenAddNotebookDialog,
  eOpenMoveNoteDialog
} from "../../utils/events";

export const ActionSheetEvent = (item, buttons) => {
  eSendEvent(eOpenActionSheet, {
    item,
    buttons
  });
};
export const ActionSheetHideEvent = () => {
  eSendEvent(eCloseActionSheet);
};

export const moveNoteEvent = () => {
  eSendEvent(eOpenMoveNoteDialog);
};
export const moveNoteHideEvent = () => {
  eSendEvent(eCloseMoveNoteDialog);
};

export const AddNotebookEvent = (notebook) => {
  eSendEvent(eOpenAddNotebookDialog, notebook);
};
export const HideAddNotebookEvent = (notebook) => {
  eSendEvent(eCloseAddNotebookDialog, notebook);
};
