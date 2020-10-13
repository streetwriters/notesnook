import {dialogActions} from './DialogActions';
import {timeConverter} from "../../utils/TimeUtils";

export const TEMPLATE_DELETE = type => {
  return {
    title: `Delete ${type}`,
    paragraph: `Are you sure you want to delete this ${type}`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    action: dialogActions.ACTION_DELETE,
    icon: 'delete',
  };
};

export const TEMPLATE_PERMANANT_DELETE = {
  title: `Delete Permanantly`,
  paragraph: `Are you sure you want to delete this item permanantly from trash?`,
  positiveText: 'Delete',
  negativeText: 'Cancel',
  action: dialogActions.ACTION_PERMANANT_DELETE,
  icon: 'delete',
};

export const TEMPLATE_TRASH = type => {
  return {
    title: `Delete ${type}`,
    paragraph: `Restore or delete ${type} forever`,
    positiveText: 'Restore',
    negativeText: 'Delete',
    action: dialogActions.ACTION_TRASH,
    icon: 'delete-restore',
  };
};

export const TEMPLATE_APPLY_CHANGES = {
  title: `Apply Changes`,
  paragraph: `Apply selected changes to note?`,
  positiveText: 'Apply',
  negativeText: 'Cancel',
  action: dialogActions.ACTION_APPLY_CHANGES,
  icon: 'check',
};

export const TEMPLATE_EXIT_FULLSCREEN = () => {
  return {
    title: `Exit fullscreen editor?`,
    paragraph: `Are you sure you want to exit fullscreen editor?`,
    positiveText: 'Exit',
    negativeText: 'Cancel',
    action: dialogActions.ACTION_EXIT_FULLSCREEN,
    icon: 'close',
  };
};

export const TEMPLATE_EXIT = type => {
  return {
    title: `Close ${type}`,
    paragraph: `Are you sure you want to close ${type}`,
    positiveText: `Close`,
    negativeText: 'Cancel',
    action: dialogActions.ACTION_EXIT,
    icon: 'close',
  };
};

export const TEMPLATE_INFO = dateCreated => {
  return {
    title: `Note Info`,
    paragraph: `Created on ${timeConverter(dateCreated)} `,
    positiveText: ``,
    negativeText: '',
    noButtons: true,
    noTitle: true,
    action: dialogActions.ACTION_CLOSE,
    icon: 'information-outline',
  };
};

export const TEMPLATE_EMPTY_TRASH = {
  title: 'Empty Trash',
  paragraph: 'Are you sure you want to clear the trash?',
  icon: 'delete-outline',
  positiveText: 'Clear',
  negativeText: 'Cancel',
  action: dialogActions.ACTION_EMPTY_TRASH,
};
export const TEMPLATE_NEW_NOTE = {
  title: 'Close Note',
  paragraph: 'Are you sure you want to close this note?',
  icon: 'close',
  positiveText: 'Yes',
  negativeText: 'Cancel',
  action: dialogActions.ACTION_NEW_NOTE,
};

export const TEMPLATE_UNPIN = (type) => { return {
  title: 'Unpin' + type,
  paragraph: 'Are you sure you want to unpin this ' + type  + '?',
  icon: 'pin-off-outline',
  positiveText: 'Unpin',
  negativeText: 'Cancel',
  action: dialogActions.ACTION_UPIN
}};
