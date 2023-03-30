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
import type {
  UpdateInfo,
  ProgressInfo,
  UpdateDownloadedEvent
} from "electron-updater";
import type { Theme } from "../utils/theme";

export const ClientPrototype = {
  onCheckingForUpdate() {},
  onUpdateAvailable(info: UpdateInfo) {},
  onUpdateDownloadProgress(progress: ProgressInfo) {},
  onUpdateDownloadCompleted(info: UpdateDownloadedEvent) {},
  onUpdateNotAvailable(info: UpdateInfo) {},
  onThemeChanged(theme: Theme) {},
  onNotificationClicked(tag: string) {},
  onCreateItem(type: "note" | "notebook" | "reminder") {
    return type;
  }
};

export type IClient = typeof ClientPrototype;
export type IClientMethod = keyof IClient;

export type IMessage = {
  type: "message";
  id: string;
  args: unknown[];
};
export type IResponse = {
  type: "response";
  id: string;
  result: unknown;
};
export type ITransport = {
  send(message: IMessage | IResponse): void;
  receive(callback: (message: IMessage | IResponse) => void): void;
};
