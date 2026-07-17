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

import { CreateTRPCProxyClient, createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc/renderer";
import type { AppRouter } from "@notesnook/desktop";
import { AppEventManager, AppEvents } from "../app-events";
import { EVENTS } from "@notesnook/core";
import { db } from "../db";
import { TaskScheduler } from "../../utils/task-scheduler";
import { checkForUpdate } from "../../utils/updater";
import { store as settingStore } from "../../stores/setting-store";

export const desktop: ReturnType<typeof createTRPCProxyClient<AppRouter>> =
  createTRPCProxyClient<AppRouter>({
    links: [ipcLink()]
  });

attachListeners();
function attachListeners() {
  console.log("attaching listeners");

  desktop.updater.onChecking.subscribe(
    undefined,
    attachListener(AppEvents.checkingForUpdate)
  );

  desktop.updater.onAvailable.subscribe(
    undefined,
    attachListener(AppEvents.updateAvailable)
  );

  desktop.updater.onDownloaded.subscribe(
    undefined,
    attachListener(AppEvents.updateDownloadCompleted)
  );

  desktop.updater.onDownloadProgress.subscribe(
    undefined,
    attachListener(AppEvents.updateDownloadProgress)
  );

  desktop.updater.onNotAvailable.subscribe(
    undefined,
    attachListener(AppEvents.updateNotAvailable)
  );

  desktop.updater.onError.subscribe(
    undefined,
    attachListener(AppEvents.updateError)
  );

  desktop.bridge.onOpenLink.subscribe(
    undefined,
    attachListener(AppEvents.onOpenLink)
  );

  TaskScheduler.register("updateCheck", "0 0 */12 * * * *", () => {
    checkForUpdate(settingStore.get().autoUpdates);
  });

  // Cross-window content sync: when another window saves a note, this
  // listener fires and we reload the note + content from the shared
  // SQLite DB and publish syncItemMerged so any open editors update.
  // Per-note debouncing avoids multiple rapid reloads while typing.
  const syncNoteTimers = new Map<string, NodeJS.Timeout>();
  if (window.appEvents?.onNoteChanged) {
    window.appEvents.onNoteChanged(async ({ noteId }: { noteId: string }) => {
      // Debounce per noteId: clear any pending timer and set a new one
      const existing = syncNoteTimers.get(noteId);
      if (existing) clearTimeout(existing);
      syncNoteTimers.set(
        noteId,
        setTimeout(async () => {
          syncNoteTimers.delete(noteId);
          try {
            const note = await db.notes.note(noteId);
            if (!note || !note.contentId) return;

            // Refresh the notes cache so the list shows the updated title/date
            await db.notes.buildCache();
            AppEventManager.publish(EVENTS.appRefreshRequested);

            const content = await db.content.get(note.contentId);
            if (content) {
              db.eventManager.publish(EVENTS.syncItemMerged, {
                ...content,
                type: "tiptap",
                noteId: note.id
              });
              db.eventManager.publish(EVENTS.syncItemMerged, {
                ...note,
                type: "note"
              });
            }
          } catch (error) {
            console.error("Failed to sync cross-window note change:", error);
          }
        }, 300)
      );
    });
  }
}

function attachListener(event: string) {
  return {
    onData(...args: any[]) {
      console.log("Received data:", args);
      AppEventManager.publish(event, ...args);
    }
  };
}

export async function createWritableStream(path: string) {
  try {
    const resolvedPath = await desktop.integration.resolvePath.query({
      filePath: path
    });
    if (!resolvedPath) throw new Error("invalid path.");
    return await window.electronFS.createWritableStream(resolvedPath);
  } catch (ex) {
    console.error(ex);
    if (ex instanceof Error) showToast("error", ex.message);
  }
}
