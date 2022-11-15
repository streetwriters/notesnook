/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import notifee, {
  AndroidStyle,
  RepeatFrequency,
  Trigger,
  TriggerType,
  AuthorizationStatus
} from "@notifee/react-native";
import dayjs from "dayjs";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import PushNotification, {
  Importance,
  PushNotificationDeliveredObject,
  PushNotificationObject
} from "react-native-push-notification";
import { db } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import { editorState } from "../screens/editor/tiptap/utils";
import { useNoteStore } from "../stores/use-notes-store";
import { eOnLoadNote } from "../utils/events";
import { tabBarRef } from "../utils/global-refs";
import { DDS } from "./device-detection";
import { eSendEvent } from "./event-manager";
import SettingsService from "./settings";

const NOTIFICATION_TAG = "notesnook";
const CHANNEL_ID = "com.streetwriters.notesnook";
let pinned: PushNotificationDeliveredObject[] = [];

async function getChannelId(id: "silent" | "vibrate" | "urgent" | "default") {
  switch (id) {
    case "default":
      return await notifee.createChannel({
        id: "com.streetwriters.notesnook",
        name: "Default"
      });
    case "silent":
      return await notifee.createChannel({
        id: "com.streetwriters.notesnook.silent",
        name: "Silent",
        vibration: false
      });
    case "vibrate":
      return await notifee.createChannel({
        id: "com.streetwriters.notesnook.silent",
        name: "Silent",
        vibration: true
      });
    case "urgent":
      return await notifee.createChannel({
        id: "com.streetwriters.notesnook.urgent",
        name: "Urgent",
        vibration: true,
        sound: "default"
      });
  }
}

export type Reminder = {
  id: string;
  title: string;
  details?: string;
  priority: "silent" | "vibrate" | "urgent";
  date: Date;
  type: "recurring" | "once" | "permanent";
  recurringMode: "weekly" | "monthly" | "daily";
  selectedDays: number[];
  dateCreated: number;
  dateModified: number;
};

async function checkAndRequestPermissions() {
  let permissionStatus = await notifee.getNotificationSettings();
  if (Platform.OS === "android") {
    if (
      permissionStatus.authorizationStatus === AuthorizationStatus.AUTHORIZED &&
      permissionStatus.android.alarm === 1
    )
      return true;
    if (permissionStatus.authorizationStatus === AuthorizationStatus.DENIED) {
      permissionStatus = await notifee.requestPermission();
    }
    if (permissionStatus.android.alarm !== 1) {
      await notifee.openAlarmPermissionSettings();
    }
    permissionStatus = await notifee.getNotificationSettings();
    if (
      permissionStatus.authorizationStatus === AuthorizationStatus.AUTHORIZED &&
      permissionStatus.android.alarm === 1
    )
      return true;
    return false;
  }
}

function getTriggers(
  reminder: Reminder
): (Trigger & { id: string })[] | undefined {
  const { date, recurringMode, selectedDays, type } = reminder;
  switch (type) {
    case "once":
      return [
        {
          timestamp: date?.getTime() as number,
          type: TriggerType.TIMESTAMP,
          id: reminder.id,
          alarmManager: {
            allowWhileIdle: true
          }
        }
      ];
    case "permanent":
      return undefined;
    case "recurring": {
      switch (recurringMode) {
        case "daily":
          return [
            {
              timestamp: date?.getTime() as number,
              type: TriggerType.TIMESTAMP,
              repeatFrequency: RepeatFrequency.DAILY,
              id: reminder.id,
              alarmManager: {
                allowWhileIdle: true
              }
            }
          ];
        case "weekly":
          return selectedDays.length === 7
            ? [
                {
                  timestamp: date.getTime() as number,
                  type: TriggerType.TIMESTAMP,
                  repeatFrequency: RepeatFrequency.DAILY,
                  id: reminder.id,
                  alarmManager: {
                    allowWhileIdle: true
                  }
                }
              ]
            : selectedDays.map((day) => ({
                timestamp: dayjs(date).day(day).toDate().getTime() as number,
                type: TriggerType.TIMESTAMP,
                repeatFrequency: RepeatFrequency.WEEKLY,
                id: `${reminder.id}_${day}`,
                alarmManager: {
                  allowWhileIdle: true
                }
              }));
        case "monthly":
          return selectedDays.length === 31
            ? [
                {
                  timestamp: date?.getTime() as number,
                  type: TriggerType.TIMESTAMP,
                  repeatFrequency: RepeatFrequency.DAILY,
                  id: reminder.id,
                  alarmManager: {
                    allowWhileIdle: true
                  }
                }
              ]
            : selectedDays.map((day) => ({
                timestamp: dayjs(date).date(day).toDate().getTime() as number,
                type: TriggerType.TIMESTAMP,
                repeatFrequency: RepeatFrequency.WEEKLY,
                id: `${reminder.id}_${day}`,
                alarmManager: {
                  allowWhileIdle: true
                }
              }));
      }

      break;
    }
  }
}

async function removeScheduledNotification(reminder: Reminder, day: number) {
  return notifee.cancelTriggerNotification(
    day ? `${reminder.id}_${day}` : reminder.id
  );
}

async function getScheduledNotificationIds() {
  return notifee.getTriggerNotificationIds();
}

async function clearAllPendingTriggersForId(_id: string) {
  const ids = await getScheduledNotificationIds();
  for (const id of ids) {
    if (id.startsWith(_id)) {
      await notifee.cancelTriggerNotification(id);
    }
  }
}

async function scheduleNotification(reminder: Reminder) {
  try {
    const { title, details, priority } = reminder;
    const triggers = getTriggers(reminder);
    if (!triggers && reminder.type === "permanent") {
      present({
        tag: reminder.id,
        title: title,
        message: details || "",
        ongoing: true,
        subtitle: details || ""
      });
      return;
    }
    await clearAllPendingTriggersForId(reminder.id);
    if (!triggers) return;
    for (const trigger of triggers) {
      console.log(trigger);
      await notifee.createTriggerNotification(
        {
          id: trigger.id,
          title: title,
          body: details,
          android: {
            channelId: await getChannelId(priority),
            smallIcon: "ic_stat_name",
            pressAction: {
              id: "default",
              mainComponent: "callofwriting"
            },
            style: !details
              ? undefined
              : {
                  type: AndroidStyle.BIGTEXT,
                  text: details
                }
          }
        },
        trigger
      );
    }
  } catch (e) {
    console.log(e);
  }
}

function loadNote(id: string, jump: boolean) {
  if (!id || id === "notesnook_note_input") return;
  const note = db.notes?.note(id).data;
  if (!DDS.isTab && jump) {
    tabBarRef.current?.goToPage(1);
  }
  eSendEvent("loadingNote", note);
  setTimeout(() => {
    eSendEvent(eOnLoadNote, note);
    if (!jump && !DDS.isTab) {
      tabBarRef.current?.goToPage(1);
    }
  }, 2000);
}

function init() {
  if (Platform.OS === "ios") return;
  PushNotification.configure({
    onNotification: async function (notification) {
      editorState().movedAway = false;
      MMKV.removeItem("appState");
      if (useNoteStore?.getState()?.loading === false) {
        await db.init();
        await db.notes?.init();
        loadNote(
          (notification as unknown as PushNotificationDeliveredObject).tag,
          false
        );
        return;
      }

      const unsub = useNoteStore.subscribe(
        (loading) => {
          if (loading === false) {
            loadNote(
              (notification as unknown as PushNotificationDeliveredObject).tag,
              true
            );
          }
          unsub();
        },
        (state) => state.loading
      );
    },
    onAction: async function (notification) {
      switch (notification.action) {
        case "UNPIN":
          remove(
            (notification as unknown as PushNotificationDeliveredObject).tag,
            notification.id
          );
          break;
        case "Hide":
          unpinQuickNote();
          break;
        case "ReplyInput":
          present({
            title: "Quick note",
            message: 'Tap on "Take note" to add a note.',
            ongoing: true,
            actions: ["ReplyInput", "Hide"],
            tag: "notesnook_note_input",
            reply_button_text: "Take note",
            reply_placeholder_text: "Write something...",
            id: 256266
          });
          await db.init();
          await db.notes?.add({
            content: {
              type: "tiptap",
              data: `<p>${
                (
                  notification as unknown as PushNotificationDeliveredObject & {
                    reply_text: string;
                  }
                ).reply_text
              } </p>`
            }
          });
          await db.notes?.init();
          useNoteStore.getState().setNotes();

          break;
      }
    },
    popInitialNotification: true,
    requestPermissions: false
  });

  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: "Notesnook",
      playSound: false,
      soundName: "default",
      importance: Importance.HIGH,
      vibrate: true
    },
    (created) => console.log(`Android Notification Channel Status: ${created}`)
  );
}

function remove(tag: string, id: string) {
  PushNotification.clearLocalNotification(
    tag || NOTIFICATION_TAG,
    parseInt(id)
  );
  get().then(() => {
    eSendEvent("onUpdate", "unpin");
  });
}

async function hasPermissions() {
  if (DeviceInfo.getApiLevelSync() < 33) return true;
  //@ts-ignore
  if (!(await PushNotification.areNotificationsEnabled())) {
    //@ts-ignore
    const result = await PushNotification.askForPermission();
    if (result) return true;
    return true;
  }
  return true;
}

async function pinQuickNote(launch: boolean) {
  if (!(await hasPermissions())) return;
  get().then((items) => {
    const notif = items.filter((i) => i.tag === "notesnook_note_input");
    if (notif && launch) {
      return;
    }
    present({
      title: "Quick note",
      message: 'Tap on "Take note" to add a note.',
      ongoing: true,
      actions: ["ReplyInput", "Hide"],
      tag: "notesnook_note_input",
      reply_button_text: "Take note",
      reply_placeholder_text: "Write something...",
      id: 256266
    });
  });
}

async function unpinQuickNote() {
  remove("notesnook_note_input", 256266 + "");
  SettingsService.set({ notifNotes: false });
}

async function present({
  title,
  message,
  subtitle,
  bigText,
  actions = [],
  ongoing,
  tag,
  reply_placeholder_text,
  reply_button_text,
  id
}: {
  title?: string;
  message: string;
  subtitle?: string;
  bigText?: string;
  actions?: Array<string>;
  ongoing?: boolean;
  tag?: string;
  reply_placeholder_text?: string;
  reply_button_text?: string;
  id?: number;
}) {
  if (!(await hasPermissions())) return;
  PushNotification.localNotification({
    id: id,
    channelId: CHANNEL_ID,
    tag: tag || NOTIFICATION_TAG,
    ongoing: ongoing,
    visibility: "private",
    ignoreInForeground: false,
    actions: actions,
    title: title,
    subText: subtitle,
    bigText: bigText,
    message: message,
    invokeApp: false,
    autoCancel: false,
    smallIcon: "ic_stat_name",
    reply_placeholder_text,
    reply_button_text
  } as PushNotificationObject & {
    reply_placeholder_text: string;
  });
}

function clearAll() {
  PushNotification.cancelAllLocalNotifications();
  PushNotification.clearAllNotifications();
}

function getPinnedNotes(): PushNotificationDeliveredObject[] {
  return pinned;
}

function get(): Promise<PushNotificationDeliveredObject[]> {
  return new Promise((resolve) => {
    if (Platform.OS === "ios") resolve([]);
    PushNotification.getDeliveredNotifications((n) => {
      pinned = n;
      resolve(n);
    });
  });
}

const Notifications = {
  init,
  present,
  clearAll,
  remove,
  get,
  getPinnedNotes,
  pinQuickNote,
  unpinQuickNote,
  scheduleNotification,
  removeScheduledNotification,
  getScheduledNotificationIds,
  checkAndRequestPermissions
};

export default Notifications;
