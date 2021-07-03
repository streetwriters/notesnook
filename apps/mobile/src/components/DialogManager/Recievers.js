import {eSendEvent} from '../../services/EventManager';
import {
  eCloseActionSheet,
  eCloseAddNotebookDialog,
  eCloseAddTopicDialog,
  eCloseMoveNoteDialog,
  eDispatchAction,
  eOpenActionSheet,
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog,
  eOpenMoveNoteDialog,
} from '../../utils/Events';

export const ActionSheetEvent = (
  item,
  colors,
  tags,
  rowItems,
  columnItems,
  extraData,
) => {
  eSendEvent(eOpenActionSheet, {
    item,
    colors,
    tags,
    rowItems,
    columnItems,
    extraData,
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

export const AddNotebookEvent = notebook => {
  eSendEvent(eOpenAddNotebookDialog, {item: notebook});
};
export const HideAddNotebookEvent = notebook => {
  eSendEvent(eCloseAddNotebookDialog, notebook);
};
export const AddTopicEvent = notebook => {
  eSendEvent(eOpenAddTopicDialog, notebook);
};
export const HideAddTopicEvent = notebook => {
  eSendEvent(eCloseAddTopicDialog, notebook);
};

export const updateEvent = data => {
  eSendEvent(eDispatchAction, data);
};
