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

import {
  addListener,
  cancelDownload,
  checkForUpdates,
  configure,
  downloadUpdate,
  installUpdate
} from "@react-native-gpui/updater";
import type { Updater, UpdaterEvents } from "../../../platform";
import { config } from "./config";
import { UPDATE_FEED_URL } from "./update-feed";

function track(): "stable" | "beta" {
  return config.get<"stable" | "beta">("releaseTrack", "stable");
}

function apply() {
  if (!UPDATE_FEED_URL) return;
  const channel = track() === "stable" ? "latest" : "beta";
  configure({
    feedUrl: `${UPDATE_FEED_URL.replace(/\/$/u, "")}/${channel}`,
    channel,
    allowDowngrade: track() === "stable"
  });
}

export const updater: Updater = {
  isConfigured: () => !!UPDATE_FEED_URL,
  async check() {
    if (!UPDATE_FEED_URL) return;
    apply();
    await checkForUpdates();
  },
  async download() {
    await downloadUpdate();
  },
  async install() {
    await installUpdate();
  },
  getAutoUpdates: async () =>
    !!UPDATE_FEED_URL && config.get<boolean>("autoUpdates", true),
  async setAutoUpdates(enabled) {
    config.set("autoUpdates", enabled);
    if (!enabled) cancelDownload();
  },
  getReleaseTrack: async () => track(),
  async setReleaseTrack(next) {
    config.set("releaseTrack", next);
    apply();
  },
  subscribe(events: UpdaterEvents) {
    const subscriptions = [
      addListener("checking", () => events.onChecking?.()),
      addListener("available", (info) => events.onAvailable?.(info)),
      addListener("not-available", () => events.onNotAvailable?.()),
      addListener("progress", ({ percent }) =>
        events.onDownloadProgress?.({ percent })
      ),
      addListener("downloaded", (info) => events.onDownloaded?.(info)),
      addListener("error", ({ message }) => events.onError?.(message))
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }
};
