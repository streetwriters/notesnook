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
import BackgroundFetch from "@ammarahmed/react-native-background-fetch";
import { AppRegistry, AppState, Platform } from "react-native";
import {
  beginBackgroundTask,
  endBackgroundTask
} from "react-native-begin-background-task";
import { DatabaseLogger, db, setupDatabase } from "../common/database";
import { deleteDCacheFiles } from "../common/filesystem/io";
import { useUserStore } from "../stores/use-user-store";
import { NotePreviewWidget } from "./note-preview-widget";
import Notifications from "./notifications";
import SettingsService from "./settings";

async function doInBackground(callback: () => Promise<void>) {
  if (Platform.OS === "ios") {
    const bgTaskId = await beginBackgroundTask();
    const result = await callback();
    await endBackgroundTask(bgTaskId);
    return result;
  } else {
    return await callback();
  }
}

let backgroundFetchStarted = false;
async function start() {
  if (backgroundFetchStarted) return;
  backgroundFetchStarted = true;
  if (!SettingsService.getProperty("backgroundSync")) {
    return;
  }
  // BackgroundFetch event handler.
  const onEvent = async (taskId: string) => {
    DatabaseLogger.info(
      `BACKGROUND FETCH ON EVENT ${taskId}, ${AppState.currentState}}`
    );
    // Do your background work...
    await onBackgroundSyncStarted();
    // IMPORTANT:  You must signal to the OS that your task is complete.
    BackgroundFetch.finish(taskId);
  };

  // Timeout callback is executed when your Task has exceeded its allowed running-time.
  // You must stop what you're doing immediately BackgroundFetch.finish(taskId)
  const onTimeout = async (taskId: string) => {
    DatabaseLogger.info(`BACKGROUND FETCH TIMEOUT: ${taskId}`);
    BackgroundFetch.finish(taskId);
  };

  // Initialize BackgroundFetch only once when component mounts.
  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,
      enableHeadless: true,
      startOnBoot: true,
      stopOnTerminate: false,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
    },
    onEvent,
    onTimeout
  );

  DatabaseLogger.info(`[BackgroundFetch] configure status: ${status}`);
}

const task = async (event: { taskId: string; timeout: boolean }) => {
  // Get task id from event {}:
  const taskId = event.taskId;
  const isTimeout = event.timeout; // <-- true when your background-time has expired.
  if (isTimeout) {
    BackgroundFetch.finish(taskId);
    return;
  }
  DatabaseLogger.info("BACKGROUND SYNC START" + taskId + AppState.currentState);
  await onBackgroundSyncStarted();
  BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(task);

async function onBackgroundSyncStarted() {
  try {
    if (!db.isInitialized) {
      await setupDatabase();
      await db.init();
    }
    const user = await db.user?.getUser();
    if (user && !useUserStore.getState().syncing) {
      useUserStore.getState().setSyncing(true);
      await db.sync({
        type: "full",
        force: false
      });
      useUserStore.getState().setSyncing(false);
    }
    await Notifications.setupReminders();

    NotePreviewWidget.updateNotes();
    deleteDCacheFiles();
    DatabaseLogger.info("BACKGROUND SYNC COMPLETE");
  } catch (e) {
    useUserStore.getState().setSyncing(false);
    DatabaseLogger.error(e as Error);
  }
}

const onBoot = async () => {
  try {
    if (!SettingsService.getProperty("backgroundSync")) {
      DatabaseLogger.info("BACKGROUND SYNC ON BOOT DISABLED");

      return;
    }

    DatabaseLogger.info("BOOT TASK STARTED");
    if (!db.isInitialized) {
      await setupDatabase();
      await db.init();
    }

    await Notifications.setupReminders();
    if (SettingsService.get().notifNotes) {
      Notifications.pinQuickNote(false);
    }
    DatabaseLogger.info("BOOT TASK COMPLETE");
  } catch (e) {
    DatabaseLogger.error(e as Error);
  }
};

const registerHeadlessTask = () =>
  AppRegistry.registerHeadlessTask(
    "com.streetwriters.notesnook.BOOT_TASK",
    () => {
      return onBoot;
    }
  );
export const BackgroundSync = {
  start,
  registerHeadlessTask,
  stop: () => {
    BackgroundFetch.stop();
  }
};

export default { doInBackground };
