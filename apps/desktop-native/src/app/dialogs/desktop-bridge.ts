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

// What the dialogs shared with apps/web reach for outside React, backed by
// @platform services: web's Electron bridge (`desktop`, from
// common/desktop-bridge), `IS_DESKTOP_APP` and `getPlatform` (utils), and the
// few `window` members they call. The shared files import these names from
// here instead of using the globals, so their code stays the same as web's.

import {
  environment,
  integration,
  lifecycle,
  shell,
  updater
} from "@platform";

export const IS_DESKTOP_APP = environment.isDesktopApp;

/** The subset of the Electron app's tRPC bridge the dialogs use. */
export const desktop = environment.isDesktopApp
  ? {
      integration: {
        setAppLanguage: {
          mutate: (language: string) => integration.setAppLanguage(language)
        },
        restart: { query: () => lifecycle.restart() },
        selectBackupDirectory: {
          query: () => integration.selectBackupDirectory()
        },
        backupDirectory: { query: () => integration.getBackupDirectory() }
      },
      updater: {
        releaseTrack: { query: () => updater.getReleaseTrack() },
        changeReleaseTrack: {
          mutate: ({ track }: { track: string }) =>
            updater.setReleaseTrack(track === "beta" ? "beta" : "stable")
        }
      }
    }
  : undefined;

const NODE_PLATFORMS = { macOS: "darwin", Windows: "win32", Linux: "linux" };

/** The OS as Electron's `window.os()` (Node's `os.platform()`) names it. */
export function getPlatform(): string | null {
  const os = environment.os;
  if (!os) return null;
  return NODE_PLATFORMS[os as keyof typeof NODE_PLATFORMS] ?? os;
}

/** The members of `window` the shared dialogs call. */
const nativeWindow = {
  open(url: string | URL, _target?: string) {
    void shell.openUrl(url.toString());
    return null;
  },
  location: {
    reload: () => lifecycle.reload(),
    get href() {
      return "";
    },
    set href(url: string) {
      void shell.openUrl(url);
    }
  }
};
export { nativeWindow as window };
