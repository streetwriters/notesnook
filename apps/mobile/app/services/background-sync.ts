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

import BackgroundFetch from "react-native-background-fetch";
import { DatabaseLogger, db } from "../common/database";
import { AppState, AppRegistry } from "react-native";
import Notifications from "./notifications";
import SettingsService from "./settings";

let backgroundFetchStarted = false;
async function start() {
  if (backgroundFetchStarted) return;
  backgroundFetchStarted = true;
  // BackgroundFetch event handler.
  const onEvent = async (taskId: string) => {
    console.log("[BackgroundFetch] task: ", taskId, AppState.currentState);
    // Do your background work...
    await onBackgroundSyncStarted();
    // IMPORTANT:  You must signal to the OS that your task is complete.
    BackgroundFetch.finish(taskId);
  };

  // Timeout callback is executed when your Task has exceeded its allowed running-time.
  // You must stop what you're doing immediately BackgroundFetch.finish(taskId)
  const onTimeout = async (taskId: string) => {
    console.warn("[BackgroundFetch] TIMEOUT: ", taskId);
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
  console.log(`[BackgroundFetch] configure status: ${status}`);
}

const task = async (event: { taskId: string; timeout: boolean }) => {
  // Get task id from event {}:
  const taskId = event.taskId;
  const isTimeout = event.timeout; // <-- true when your background-time has expired.
  if (isTimeout) {
    console.log("[BackgroundFetch] Headless TIMEOUT:", taskId);
    BackgroundFetch.finish(taskId);
    return;
  }
  DatabaseLogger.info(
    "[BackgroundFetch HeadlessTask] start: " + taskId + AppState.currentState
  );
  await onBackgroundSyncStarted();
  BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(task);

async function onBackgroundSyncStarted() {
  try {
    DatabaseLogger.info("Background Sync" + "start");
    await db.init();
    const user = await db.user?.getUser();
    if (user) {
      await db.sync(true, false);
    }
    await Notifications.setupReminders();
    DatabaseLogger.info("Background Sync" + "end");
  } catch (e) {
    DatabaseLogger.error(e as Error);
    console.log("Background Sync Error", (e as Error).message);
  }
}

const onBoot = async () => {
  try {
    DatabaseLogger.info("BOOT TASK STARTED");
    await db.init();
    await Notifications.setupReminders();
    SettingsService.init();
    if (SettingsService.get().notifNotes) {
      Notifications.pinQuickNote(false);
    }
    DatabaseLogger.info("BOOT TASK COMPLETE");
  } catch (e) {
    console.log(e);
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
  registerHeadlessTask
};
