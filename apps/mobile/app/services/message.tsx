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
import React from "react";
import { strings } from "@notesnook/intl";
import { Platform } from "react-native";
import { AuthMode } from "../components/auth/common";
import { verifyUser } from "../screens/settings/functions";
import {
  Message,
  MessageId,
  useMessageStore
} from "../stores/use-message-store";
import { eOpenRateDialog, eOpenRecoveryKeyDialog } from "../utils/events";
import { eSendEvent, presentSheet } from "./event-manager";
import Navigation from "./navigation";
import PremiumService from "./premium";
import SettingsService from "./settings";
import { Update } from "../components/sheets/update";
import { GithubVersionInfo } from "../utils/github-version";
import { CheckVersionResponse } from "react-native-check-version";

const APP_MESSAGE_BUILDERS: Record<
  MessageId,
  (data?: object) => Message
> = {
  "rate-app": () => ({
    visible: true,
    message: strings.rateAppMessage(),
    actionText: strings.rateAppActionText(Platform.OS),
    onPress: () => {
      eSendEvent(eOpenRateDialog);
    },
    data: {},
    icon: "star",
    type: "normal",
    id: "rate-app"
  }),
  "recovery-key": () => ({
    visible: true,
    message: strings.recoveryKeyMessage(),
    actionText: strings.recoveryKeyMessageActionText(),
    onPress: () => {
      verifyUser(
        null,
        () => {
          eSendEvent(eOpenRecoveryKeyDialog);
        },
        false,
        async () => {
          SettingsService.set({
            recoveryKeySaved: true
          });
          clearMessage();
        },
        "Cancel"
      );
    },
    data: {},
    icon: "key",
    type: "normal",
    id: "recovery-key"
  }),
  "log-in": () => ({
    visible: true,
    message: strings.loginMessage(),
    actionText: strings.loginMessageActionText(),
    onPress: () => {
      Navigation.navigate("Auth", {
        mode: AuthMode.login
      });
    },
    data: {},
    icon: "account-outline",
    type: "normal",
    id: "log-in"
  }),
  "confirm-email": () => ({
    visible: true,
    message: strings.syncDisabled(),
    actionText: strings.syncDisabledActionText(),
    onPress: () => {
      PremiumService.showVerifyEmailDialog();
    },
    data: {},
    icon: "email",
    type: "error",
    id: "confirm-email"
  }),
  "app-update": (data) => {
    const version = (data as { version?: GithubVersionInfo | CheckVersionResponse } | undefined)?.version;
    return {
      visible: true,
      message: strings.newUpdateMessage(),
      actionText: strings.newUpdateActionText(),
      onPress: () => {
        if (version) {
          presentSheet({
            component: (ref) => <Update version={version} fwdRef={ref} />
          });
        }
      },
      data: data || {},
      icon: "update",
      type: "normal",
      id: "app-update"
    };
  },
  none: () => ({}) as Message
};

export function setMessageById(id: MessageId, data?: object) {
  useMessageStore.getState().setMessage({
    ...useMessageStore.getState().message,
    visible: id !== "none",
    id,
    data: data || {}
  });
}

export function getMessageById(
  id: MessageId,
  data?: object
): Message | null {
  const builder = APP_MESSAGE_BUILDERS[id];
  if (builder && id !== "none") {
    return builder(data);
  }
  return null;
}

export function setRateAppMessage() {
  setMessageById("rate-app");
}

export function setRecoveryKeyMessage() {
  setMessageById("recovery-key");
}

export function setLoginMessage() {
  setMessageById("log-in");
}

export function setEmailVerifyMessage() {
  setMessageById("confirm-email");
}

export function clearMessage() {
  useMessageStore.getState().setMessage({
    ...useMessageStore.getState().message,
    visible: false
  });
}

export function setUpdateAvailableMessage(
  version: GithubVersionInfo | CheckVersionResponse
) {
  setMessageById("app-update", { version });
}

