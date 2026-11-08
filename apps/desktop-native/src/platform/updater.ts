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

import type { Unsubscribe } from "./lifecycle";

export interface UpdateInfo {
  version: string;
}

export interface UpdaterEvents {
  onChecking?(): void;
  onAvailable?(info: UpdateInfo): void;
  onNotAvailable?(): void;
  onDownloadProgress?(progress: { percent: number }): void;
  onDownloaded?(info: UpdateInfo): void;
  onError?(error: string): void;
}

export interface Updater {
  check(): Promise<void>;
  download(): Promise<void>;
  install(): Promise<void>;
  getAutoUpdates(): Promise<boolean>;
  setAutoUpdates(enabled: boolean): Promise<void>;
  getReleaseTrack(): Promise<"stable" | "beta">;
  setReleaseTrack(track: "stable" | "beta"): Promise<void>;
  subscribe(events: UpdaterEvents): Unsubscribe;
}
