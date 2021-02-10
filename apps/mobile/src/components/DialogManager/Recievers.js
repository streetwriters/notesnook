import {eSendEvent} from '../../services/EventManager';
import {
  eCloseActionSheet,
  eCloseAddNotebookDialog,
  eCloseAddTopicDialog,
  eCloseMoveNoteDialog,
  eCloseSimpleDialog,
  eOpenActionSheet,
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog,
  eOpenMoveNoteDialog,
  eOpenSimpleDialog,
  eDispatchAction,
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

export const simpleDialogEvent = data => {
  eSendEvent(eOpenSimpleDialog, data);
};

export const simpleDialogHideEvent = () => {
  eSendEvent(eCloseSimpleDialog);
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
