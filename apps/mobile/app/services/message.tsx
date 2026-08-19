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

const APP_MESSAGE_BUILDERS: Record<MessageId, () => Message> = {
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
  "app-update": () => ({}) as Message,
  none: () => ({}) as Message
};

function showMessageById(id: MessageId) {
  if (APP_MESSAGE_BUILDERS[id]) {
    useMessageStore.getState().setMessage(APP_MESSAGE_BUILDERS[id]());
  }
}

export function getLocalizedMessageStrings(id: MessageId): { message: string; actionText: string } | null {
  if (id === "app-update") {
    return {
      message: strings.newUpdateMessage(),
      actionText: strings.newUpdateActionText()
    };
  }
  const builder = APP_MESSAGE_BUILDERS[id];
  if (builder && id !== "none") {
    const msg = builder();
    return {
      message: msg.message as string,
      actionText: msg.actionText as string
    };
  }
  return null;
}

export function setRateAppMessage() {
  showMessageById("rate-app");
}

export function setRecoveryKeyMessage() {
  showMessageById("recovery-key");
}

export function setLoginMessage() {
  showMessageById("log-in");
}

export function setEmailVerifyMessage() {
  showMessageById("confirm-email");
}

export function clearMessage() {
  useMessageStore.getState().setMessage({
    ...useMessageStore.getState().message,
    visible: false
  });
}

const updateAvailableMessage = (
  version: GithubVersionInfo | CheckVersionResponse
) =>
  ({
    visible: true,
    message: strings.newUpdateMessage(),
    actionText: strings.newUpdateActionText(),
    onPress: () => {
      presentSheet({
        component: (ref) => <Update version={version} fwdRef={ref} />
      });
    },
    data: {},
    icon: "update",
    type: "normal",
    id: "app-update"
  }) as Message;

export function setUpdateAvailableMessage(
  version: GithubVersionInfo | CheckVersionResponse
) {
  useMessageStore.getState().setMessage(updateAvailableMessage(version));
}
