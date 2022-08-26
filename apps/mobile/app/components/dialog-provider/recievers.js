import { eSendEvent } from "../../services/event-manager";
import {
  eCloseActionSheet,
  eCloseAddNotebookDialog,
  eCloseAddTopicDialog,
  eCloseMoveNoteDialog,
  eOpenActionSheet,
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog,
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
export const AddTopicEvent = (topic) => {
  eSendEvent(eOpenAddTopicDialog, topic);
};
export const HideAddTopicEvent = (notebook) => {
  eSendEvent(eCloseAddTopicDialog, notebook);
};
