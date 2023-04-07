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

import EventManager from "@notesnook/core/utils/event-manager";
import Clipboard from "@react-native-clipboard/clipboard";
import { RefObject } from "react";
import { ActionSheetRef } from "react-native-actions-sheet";
import Config from "react-native-config";
import {
  eCloseSheet,
  eHideToast,
  eOnNoteEdited,
  eOpenSheet,
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

export const openVault = (data: Partial<Vault>) => {
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
    | ((
        ref: RefObject<ActionSheetRef>,
        close?: (ctx?: string) => void,
        update?: (props: PresentSheetOptions) => void
      ) => JSX.Element);
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
  enableGesturesInScrollView?: boolean;
  noBottomPadding?: boolean;
};

export function presentSheet(data: Partial<PresentSheetOptions>) {
  eSendEvent(eOpenSheet, data);
}

export function hideSheet() {
  eSendEvent(eCloseSheet);
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
