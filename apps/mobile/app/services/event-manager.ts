import Clipboard from "@react-native-clipboard/clipboard";
import EventManager from "@streetwriters/notesnook-core/utils/eventmanager";
import { RefObject } from "react";
import ActionSheet from "react-native-actions-sheet";
import { Config } from "react-native-config";
import {
  eHideToast,
  eOnNoteEdited,
  eOpenProgressDialog,
  eOpenVaultDialog,
  eShowToast
} from "../utils/events";

type Vault = {
  item: unknown;
  novault: boolean;
  title: string;
  description: string;
  locked: boolean;
  permanant: boolean;
  goToEditor: boolean;
  share: boolean;
  deleteNote: boolean;
  fingerprintAccess: boolean;
  revokeFingerprintAccess: boolean;
  changePassword: boolean;
  clearVault: boolean;
  deleteVault: boolean;
  copyNote: boolean;
};

type NoteEdit = {
  id: string;
  closed: boolean;
  noEdit: boolean;
  forced: boolean;
};

const eventManager = new EventManager();

export const eSubscribeEvent = <T = unknown>(
  eventName: string,
  action?: (data: T) => void
) => {
  eventManager.subscribe(eventName, action);
};

export const eUnSubscribeEvent = <T = unknown>(
  eventName: string,
  action?: (data: T) => void
) => {
  eventManager.unsubscribe(eventName, action);
};

export const eSendEvent = (eventName: string, data?: unknown) => {
  eventManager.publish(eventName, data);
};

export const openVault = (data: Vault) => {
  eSendEvent(eOpenVaultDialog, data);
};

export function sendNoteEditedEvent(data: NoteEdit) {
  eSendEvent(eOnNoteEdited, data);
}

type SheetAction = {
  action: () => void;
  actionText: string;
  iconColor?: string;
  icon?: string;
  type?: string;
};

export type PresentSheetOptions = {
  context: string;
  component:
    | JSX.Element
    | ((ref: RefObject<ActionSheet>, close?: () => void) => JSX.Element);
  disableClosing: boolean;
  onClose: () => void;
  progress: boolean;
  icon: string;
  title: string;
  paragraph: string;
  valueArray?: string[];
  action: () => void;
  actionText: string;
  iconColor?: string;
  actionsArray: SheetAction[];
  learnMore: string;
  learnMorePress: () => void;
};

export function presentSheet(data: Partial<PresentSheetOptions>) {
  eSendEvent(eOpenProgressDialog, data);
}

export type ShowToastEvent = {
  heading?: string;
  message?: string;
  context?: "global" | "local";
  type?: "error" | "success";
  duration?: number;
  func?: () => void;
  actionText?: string;
};

export const ToastEvent = {
  show: ({
    heading,
    message,
    type = "error",
    context = "global",
    func,
    actionText
  }: ShowToastEvent) => {
    if (Config.isTesting) return;
    eSendEvent(eShowToast, {
      heading: heading,
      message: message,
      type: type,
      context: context,
      duration: 3000,
      func: func,
      actionText: actionText
    });
  },
  hide: () => eSendEvent(eHideToast),
  error: (e: Error, title?: string, context?: "global" | "local") => {
    ToastEvent.show({
      heading: title,
      message: e?.message || "",
      type: "error",
      context: context || "global",
      actionText: "Copy logs",
      duration: 6000,
      func: () => {
        Clipboard.setString(e?.stack || "");
        ToastEvent.show({
          heading: "Logs copied!",
          type: "success",
          context: "global",
          duration: 5000
        });
      }
    });
  }
};

/*

*/
