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

import { isReminderActive, Reminder } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import notifee, {
  AndroidStyle,
  AuthorizationStatus,
  DisplayedNotification,
  Event,
  EventType,
  RepeatFrequency,
  TimestampTrigger,
  Trigger,
  TriggerNotification,
  TriggerType
} from "@notifee/react-native";
import NetInfo from "@react-native-community/netinfo";
import dayjs, { Dayjs } from "dayjs";
import { encodeNonAsciiHTML } from "entities";
import { Platform } from "react-native";
import { db, setupDatabase } from "../common/database";
import { presentDialog } from "../components/dialog/functions";
import { useTabStore } from "../screens/editor/tiptap/use-tab-store";
import { editorState } from "../screens/editor/tiptap/utils";
import { useRelationStore } from "../stores/use-relation-store";
import { useReminderStore } from "../stores/use-reminder-store";
import { useSettingStore } from "../stores/use-setting-store";
import { useUserStore } from "../stores/use-user-store";
import { eOnLoadNote } from "../utils/events";
import { fluidTabsRef } from "../utils/global-refs";
import { convertNoteToText } from "../utils/note-to-text";
import { NotesnookModule } from "../utils/notesnook-module";
import { sleep } from "../utils/time";
import { DDS } from "./device-detection";
import { eSendEvent } from "./event-manager";
import Navigation from "./navigation";
import SettingsService from "./settings";
import { getFormattedReminderTime } from "@notesnook/common";

let pinned: DisplayedNotification[] = [];

/**
 *
 * @platform android
 */
async function getNextMonthlyReminderDate(
  reminder: Reminder,
  year: number
): Promise<Dayjs> {
  const currentMonth = dayjs().month();
  for (let i = currentMonth; i < 12; i++) {
    const sortedDays = reminder.selectedDays?.sort((a, b) => a - b);
    for (const day of sortedDays as number[]) {
      const date = dayjs(reminder.date).year(year).month(i).date(day);
      if (date.daysInMonth() < day || dayjs().isAfter(date)) continue;
      return date;
    }
  }
  return await getNextMonthlyReminderDate(reminder, dayjs().year() + 1);
}

export function textToHTML(src: string) {
  return src
    .split(/[\r\n]/)
    .map((line) =>
      line
        ? `<p data-spacing="single">${encodeLine(line)}</p>`
        : `<p data-spacing="single"></p>`
    )
    .join("");
}

function encodeLine(line: string) {
  line = encodeNonAsciiHTML(line);
  line = line.replace(/(^ +)|( {2,})/g, (sub, ...args) => {
    const [starting, inline] = args;
    if (starting) return "&nbsp;".repeat(starting.length);
    if (inline) return "&nbsp;".repeat(inline.length);
    return sub;
  });
  return line;
}

async function initDatabase() {
  if (!db.isInitialized) {
    await setupDatabase();
    await db.init();
  }
}

const onEvent = async ({ type, detail }: Event) => {
  await initDatabase();
  const { notification, pressAction, input } = detail;
  if (type === EventType.DELIVERED && Platform.OS === "android") {
    if (notification?.id) {
      const reminder = await db.reminders?.reminder(
        notification?.id?.split("_")[0]
      );

      if (
        reminder &&
        (reminder.recurringMode === "month" ||
          reminder?.recurringMode === "year")
      ) {
        await scheduleNotification(reminder);
      }
    }
    updateRemindersForWidget();
    return;
  }
  if (type === EventType.PRESS) {
    notifee.decrementBadgeCount();
    if (notification?.data?.type === "quickNote") return;
    NotesnookModule.setAppState("");
    if (notification?.data?.type === "reminder" && notification?.id) {
      const reminder = await db.reminders?.reminder(
        notification.id?.split("_")[0]
      );
      if (!reminder) return;
      await sleep(1000);
      const ReminderNotify =
        require("../components/sheets/reminder-notify").default;
      ReminderNotify.present(reminder);
      useRelationStore.getState().update();
      return;
    }
    editorState().movedAway = false;
    const noteId = notification?.id;

    loadNote(noteId as string, true);
  }

  if (type === EventType.ACTION_PRESS) {
    notifee.decrementBadgeCount();
    switch (pressAction?.id) {
      case "REMINDER_SNOOZE": {
        if (!notification?.id) break;
        const reminder = await db.reminders?.reminder(
          notification?.id?.split("_")[0]
        );
        if (!reminder) break;

        const reminderTime = parseInt(
          SettingsService.get().defaultSnoozeTime || "5"
        );
        await db.reminders?.add({
          ...reminder,
          snoozeUntil: Date.now() + reminderTime * 60000
        });
        await Notifications.scheduleNotification(
          await db.reminders?.reminder(reminder?.id)
        );
        useRelationStore.getState().update();
        useReminderStore.getState().refresh();
        updateRemindersForWidget();
        break;
      }
      case "REMINDER_DISABLE": {
        if (!notification?.id) break;
        const reminder = await db.reminders?.reminder(
          notification?.id?.split("_")[0]
        );
        await db.reminders?.add({
          ...reminder,
          disabled: true
        });
        if (!reminder?.id) break;
        await Notifications.scheduleNotification(
          await db.reminders?.reminder(reminder?.id)
        );
        useRelationStore.getState().update();
        useReminderStore.getState().refresh();
        updateRemindersForWidget();
        break;
      }
      case strings.unpin(): {
        if (!notification?.id) break;
        remove(notification?.id as string);
        const reminder = await db.reminders?.reminder(
          notification?.id?.split("_")[0]
        );
        if (reminder) {
          await db.reminders?.add({
            ...reminder,
            disabled: true
          });
          useRelationStore.getState().update();
          useReminderStore.getState().refresh();
        }
        break;
      }

      case strings.hide():
        unpinQuickNote();
        break;
      case "ReplyInput": {
        displayNotification({
          title: strings.quickNoteTitle(),
          message: strings.quickNoteContent(),
          ongoing: true,
          actions: ["ReplyInput", strings.hide()],
          id: "notesnook_note_input",
          reply_button_text: strings.takeNote(),
          reply_placeholder_text: strings.quickNotePlaceholder()
        });

        const id = await db.notes?.add({
          content: {
            type: "tiptap",
            data: textToHTML(input as string)
          }
        });

        const defaultNotebook = db.settings?.getDefaultNotebook();

        if (defaultNotebook) {
          await db.notes?.addToNotebook(defaultNotebook, id);
        }

        const status = await NetInfo.fetch();
        if (status.isInternetReachable) {
          try {
            if (!globalThis["IS_MAIN_APP_RUNNING" as never]) {
              await db.sync({ type: "send", force: false });
            }
          } catch (e) {
            /* empty */
          }
        }
        Navigation.queueRoutesForUpdate();
        break;
      }
    }
  }
};

type ReminderWithFormattedTime = Reminder & {
  formattedTime?: string;
};

async function updateRemindersForWidget() {
  if (Platform.OS === "ios") return;
  const reminders: ReminderWithFormattedTime[] = await db.reminders?.all.items(
    undefined,
    {
      sortBy: "dueDate",
      sortDirection: "asc"
    }
  );
  const activeReminders = [];
  if (!reminders) return;
  for (const reminder of reminders) {
    if (isReminderActive(reminder)) {
      reminder.formattedTime = getFormattedReminderTime(reminder);
      activeReminders.push(reminder);
    }
  }
  NotesnookModule.setString(
    "appPreview",
    "remindersList",
    JSON.stringify(activeReminders)
  );
  NotesnookModule.updateReminderWidget();
}

async function setupIOSCategories() {
  try {
    if (Platform.OS === "ios") {
      const categories = await notifee.getNotificationCategories();
      const reminderTime = SettingsService.get().defaultSnoozeTime;
      if (categories.findIndex((c) => c.id === "REMINDER") === -1) {
        await notifee.setNotificationCategories([
          {
            id: "REMINDER",
            actions: [
              {
                id: "REMINDER_SNOOZE",
                foreground: false,
                title: strings.remindMeIn() + ` ${reminderTime} min`,
                authenticationRequired: false
              }
            ]
          },
          {
            id: "REMINDER_RECURRING",
            actions: [
              {
                id: "REMINDER_SNOOZE",
                foreground: false,
                title: strings.remindMeIn() + ` ${reminderTime} min`,
                authenticationRequired: false
              },
              {
                id: "REMINDER_DISABLE",
                foreground: false,
                title: strings.disable(),
                authenticationRequired: false
              }
            ]
          }
        ]);
      }
    }
  } catch (e) {
    /* empty */
  }
}

async function scheduleNotification(
  reminder: Reminder | undefined,
  payload?: string
) {
  if (!reminder) return;
  if (!useSettingStore.getState().settings.reminderNotifications) return;

  try {
    const { title, description, priority } = reminder;
    await clearAllPendingTriggersForId(reminder.id);
    if (reminder.disabled) {
      remove(reminder.id);
      return;
    }
    const triggers = await getTriggers(reminder);
    if (reminder.mode === "permanent") {
      const notifications = await get();
      const pinned = notifications.findIndex((i) => i.id === reminder.id) > -1;
      if (!pinned) {
        displayNotification({
          id: reminder.id,
          title: title,
          message: description || "",
          ongoing: true,
          subtitle: description || "",
          actions: [strings.unpin()]
        });
      }
      return;
    }
    await setupIOSCategories();
    if (!triggers) return;
    for (const trigger of triggers) {
      if (
        (trigger as TimestampTrigger).timestamp < Date.now() &&
        reminder.mode === "once"
      )
        continue;
      const iosProperties: { [name: string]: any } = {};
      const notificationSound = SettingsService.get().notificationSound;
      if (priority === "urgent") {
        iosProperties["sound"] = notificationSound?.url || "default";
      }

      const reminderTime = SettingsService.get().defaultSnoozeTime;
      const androidActions = [
        {
          title: `Remind in ${reminderTime} min`,
          pressAction: {
            id: "REMINDER_SNOOZE"
          }
        }
      ];
      if (reminder.mode === "repeat") {
        androidActions.push({
          title: strings.disable(),
          pressAction: {
            id: "REMINDER_DISABLE"
          }
        });
      }

      await notifee.createTriggerNotification(
        {
          id: trigger.id,
          title: !title ? undefined : title,
          body: !description ? undefined : description,
          data: {
            type: "reminder",
            payload: payload || "",
            dateModified: reminder.dateModified + ""
          },
          subtitle: !description ? undefined : description,
          android: {
            channelId: await getChannelId(priority),
            smallIcon: "ic_stat_name",
            pressAction: {
              id: "default",
              mainComponent: "notesnook"
            },
            badgeCount: 1,
            actions: androidActions,
            sound: notificationSound?.url,
            style: !description
              ? undefined
              : {
                  type: AndroidStyle.BIGTEXT,
                  text: description
                }
          },
          ios: {
            interruptionLevel: "active",
            criticalVolume: 1.0,
            badgeCount: 1,
            critical:
              reminder.priority === "silent" || reminder.priority === "urgent"
                ? false
                : true,
            categoryId:
              reminder.mode === "repeat" ? "REMINDER_RECURRING" : "REMINDER",
            ...iosProperties
          }
        },
        trigger
      );
    }
    updateRemindersForWidget();
  } catch (e) {
    /* empty */
  }
}

async function loadNote(id: string, jump: boolean) {
  if (!id || id === "notesnook_note_input") return;
  const note = await db.notes.note(id);
  if (!note) return;
  if (!DDS.isTab && jump) {
    fluidTabsRef.current?.goToPage(1);
  }
  NotesnookModule.setAppState(
    JSON.stringify({
      editing: true,
      movedAway: false,
      timestamp: Date.now()
    })
  );

  const tab = useTabStore.getState().getTabForNote(id);
  if (useTabStore.getState().currentTab !== tab) {
    eSendEvent(eOnLoadNote, {
      note: note
    });
  }
}

async function getChannelId(id: "silent" | "vibrate" | "urgent" | "default") {
  const notificationSound = SettingsService.get().notificationSound;
  switch (id) {
    case "default":
      return await notifee.createChannel({
        id: "com.streetwriters.notesnook",
        name: "Default",
        vibration: false
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
        name: "Vibrate",
        vibration: true
      });
    case "urgent":
      return await notifee.createChannel({
        id: "com.streetwriters.notesnook.urgent",
        name: "Urgent",
        description:
          "This channel is used to show notifications with sound & vibration.",
        vibration: true,
        sound: notificationSound?.url || "default",
        bypassDnd: true
      });
  }
}

async function displayNotification({
  title,
  message,
  subtitle,
  bigText,
  actions = [],
  ongoing,
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
  reply_placeholder_text?: string;
  reply_button_text?: string;
  id?: string;
}) {
  useUserStore.setState({
    disableAppLockRequests: true
  });
  const permission = await checkAndRequestPermissions();
  useUserStore.setState({
    disableAppLockRequests: false
  });

  if (!permission) return;

  try {
    await notifee.displayNotification({
      id: id,
      title: title,
      body: message,
      subtitle: subtitle,
      data: {
        type: reply_placeholder_text ? "quickNote" : "pinnedNote"
      },
      android: {
        ongoing: ongoing,
        smallIcon: "ic_stat_name",
        localOnly: true,
        channelId: await getChannelId("default"),
        autoCancel: false,
        pressAction: {
          id: "default",
          mainComponent: "notesnook"
        },
        actions: actions?.map((action) => ({
          pressAction: {
            id: action
          },
          title:
            action === "ReplyInput" ? (reply_button_text as string) : action,
          input:
            action !== "ReplyInput"
              ? undefined
              : {
                  placeholder: reply_placeholder_text,
                  allowFreeFormInput: true
                }
        })),
        style: !bigText
          ? undefined
          : {
              type: AndroidStyle.BIGTEXT,
              text: bigText
            }
      }
    });
  } catch (e) {
    /* empty */
  }
}

function openSettingsDialog(context: string) {
  return new Promise((resolve) => {
    presentDialog({
      title: strings.notificationsDisabled(),
      paragraph: strings.notificationsDisabledDesc(),
      positiveText: Platform.OS === "ios" ? undefined : strings.openSettings(),
      negativeText: Platform.OS === "ios" ? strings.close() : strings.cancel(),
      positivePress:
        Platform.OS === "ios"
          ? undefined
          : () => {
              resolve(true);
            },
      onClose: () => {
        resolve(false);
      },
      context: context
    });
  });
}

async function checkAndRequestPermissions(
  promptUser?: boolean
): Promise<boolean> {
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

    if (promptUser) {
      if (await openSettingsDialog("local")) {
        await notifee.openNotificationSettings();
        return false;
      }
    }

    return false;
  } else {
    permissionStatus = await notifee.requestPermission();
    if (permissionStatus.authorizationStatus === AuthorizationStatus.AUTHORIZED)
      return true;
    if (promptUser) {
      await openSettingsDialog("local");
    }
    return false;
  }
}

async function getTriggers(
  reminder: Reminder
): Promise<(Trigger & { id: string })[] | undefined> {
  const { date, recurringMode, selectedDays, mode, snoozeUntil } = reminder;
  let triggers: (Trigger & { id: string })[] = [];

  if (snoozeUntil && snoozeUntil > Date.now()) {
    triggers.push({
      timestamp: snoozeUntil as number,
      type: TriggerType.TIMESTAMP,
      id: reminder.id + "_snz",
      alarmManager: {
        allowWhileIdle: true
      }
    });
  }
  const relativeTime = dayjs(date);
  switch (mode) {
    case "once":
      if (date < Date.now()) break;
      triggers.push({
        timestamp: date as number,
        type: TriggerType.TIMESTAMP,
        id: reminder.id,
        alarmManager: {
          allowWhileIdle: true
        }
      });
      break;
    case "permanent":
      return undefined;
    case "repeat": {
      switch (recurringMode) {
        case "day": {
          let timestamp = dayjs()
            .hour(relativeTime.hour())
            .minute(relativeTime.minute());
          if (timestamp.isBefore(dayjs())) {
            do {
              timestamp = timestamp.add(1, "day");
              timestamp.second(0);
            } while (timestamp.isBefore(dayjs()));
          }
          triggers.push({
            timestamp: timestamp.valueOf() as number,
            type: TriggerType.TIMESTAMP,
            repeatFrequency: RepeatFrequency.DAILY,
            id: reminder.id,
            alarmManager: {
              allowWhileIdle: true
            }
          });

          break;
        }

        case "week":
          if (!selectedDays) break;
          if (selectedDays.length === 7) {
            triggers = [
              {
                timestamp: date as number,
                type: TriggerType.TIMESTAMP,
                repeatFrequency: RepeatFrequency.DAILY,
                id: reminder.id,
                alarmManager: {
                  allowWhileIdle: true
                }
              }
            ];
            break;
          }

          for (const day of selectedDays) {
            let timestamp = dayjs()
              .day(day)
              .hour(relativeTime.hour())
              .minute(relativeTime.minute());

            if (timestamp.isBefore(dayjs())) {
              do {
                timestamp = timestamp.add(1, "week");
              } while (timestamp.isBefore(dayjs()));
            }

            triggers.push({
              timestamp: timestamp.toDate().getTime() as number,
              type: TriggerType.TIMESTAMP,
              repeatFrequency: RepeatFrequency.WEEKLY,
              id: `${reminder.id}_${day}`,
              alarmManager: {
                allowWhileIdle: true
              }
            });
          }

          break;
        case "month":
          if (!selectedDays) break;
          if (selectedDays.length === 31) {
            triggers = [
              {
                timestamp: date as number,
                type: TriggerType.TIMESTAMP,
                repeatFrequency: RepeatFrequency.DAILY,
                id: reminder.id,
                alarmManager: {
                  allowWhileIdle: true
                }
              }
            ];
            break;
          }
          if (Platform.OS === "ios") {
            for (const day of selectedDays) {
              let timestamp = dayjs()
                .date(day)
                .hour(relativeTime.hour())
                .minute(relativeTime.minute());

              if (timestamp.isBefore(dayjs())) {
                do {
                  timestamp = timestamp.add(1, "month");
                } while (timestamp.isBefore(dayjs()));
              }
              triggers.push({
                timestamp: timestamp.toDate().getTime() as number,
                type: TriggerType.TIMESTAMP,
                repeatFrequency: RepeatFrequency.MONTHLY,
                id: `${reminder.id}_${day}`,
                alarmManager: {
                  allowWhileIdle: true
                }
              });
            }
          } else {
            const reminderDate = await getNextMonthlyReminderDate(
              reminder,
              dayjs().year()
            );
            triggers.push({
              timestamp: reminderDate.toDate().getTime() as number,
              type: TriggerType.TIMESTAMP,
              id: reminder.id,
              alarmManager: {
                allowWhileIdle: true
              }
            });
          }

          break;
        case "year":
          {
            let timestamp = dayjs()
              .month(relativeTime.month())
              .date(relativeTime.date())
              .hour(relativeTime.hour())
              .minute(relativeTime.minute());
            // Timestamp must always be in future.
            if (timestamp.isBefore(dayjs())) {
              do {
                timestamp = timestamp.add(1, "year");
              } while (timestamp.isBefore(dayjs()));
            }

            if (Platform.OS === "ios") {
              triggers.push({
                timestamp: timestamp.toDate().getTime() as number,
                type: TriggerType.TIMESTAMP,
                repeatFrequency: RepeatFrequency.YEARLY,
                id: `${reminder.id}`,
                alarmManager: {
                  allowWhileIdle: true
                }
              });
            } else {
              triggers.push({
                timestamp: timestamp.toDate().getTime() as number,
                type: TriggerType.TIMESTAMP,
                id: reminder.id,
                alarmManager: {
                  allowWhileIdle: true
                }
              });
            }
          }
          break;
      }
    }
  }
  return triggers;
}

async function unpinQuickNote() {
  remove("notesnook_note_input");
  SettingsService.set({ notifNotes: false });
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
  if (!_id) return;
  const ids = await getScheduledNotificationIds();
  for (const id of ids) {
    if (id.startsWith(_id)) {
      await notifee.cancelTriggerNotification(id);
    }
  }
}

function clearAll() {
  notifee.cancelDisplayedNotifications();
}

function clearAllTriggers() {
  notifee.cancelTriggerNotifications();
}

function getPinnedNotes(): DisplayedNotification[] {
  return pinned;
}

function isNotePinned(id: string) {
  if (Platform.OS !== "android") return false;
  return pinned.findIndex((notification) => notification.id === id) > -1;
}

function get(): Promise<DisplayedNotification[]> {
  return new Promise((resolve) => {
    if (Platform.OS === "ios") resolve([]);
    notifee.getDisplayedNotifications().then((notifications) => {
      pinned = notifications;
      resolve(notifications);
    });
  });
}

function init() {
  notifee.onBackgroundEvent(onEvent);
  notifee.onForegroundEvent(onEvent);
}

async function remove(id: string) {
  await notifee.cancelNotification(id);
  get().then(() => {
    eSendEvent("onUpdate", "unpin");
  });
}

async function pinQuickNote(launch: boolean) {
  useUserStore.setState({
    disableAppLockRequests: true
  });
  const permission = await checkAndRequestPermissions();
  useUserStore.setState({
    disableAppLockRequests: false
  });
  if (!permission) {
    return;
  }
  get().then((items) => {
    const notification = items.filter((n) => n.id === "notesnook_note_input");
    if (notification && launch) {
      return;
    }
    displayNotification({
      title: strings.quickNoteTitle(),
      message: strings.quickNoteContent(),
      ongoing: true,
      actions: ["ReplyInput", strings.hide()],
      reply_button_text: strings.takeNote(),
      reply_placeholder_text: strings.quickNotePlaceholder(),
      id: "notesnook_note_input"
    });
  });
}

/**
 * A function that checks if reminders need to be reconfigured &
 * reschedules them if anything has changed.
 */
async function setupReminders(checkNeedsScheduling = false) {
  const reminders = ((await db.reminders?.all.items()) as Reminder[]) || [];
  const triggers = await notifee.getTriggerNotifications();
  for (const reminder of reminders) {
    if (reminder.mode === "permanent") {
      await scheduleNotification(reminder);
    }

    // Skip reminders that are not repeating and their trigger date is in past.
    if (reminder.mode === "once" && dayjs().isAfter(reminder.date)) continue;

    const pending = triggers.filter((t) =>
      t.notification.id?.startsWith(reminder.id)
    );

    let needsReschedule = pending.length === 0 ? true : false;
    if (!needsReschedule) {
      needsReschedule = pending[0].notification.data?.dateModified
        ? parseInt(pending[0].notification.data?.dateModified as string) <
          reminder.dateModified
        : true;
    }

    if (!needsReschedule && checkNeedsScheduling) continue;

    await scheduleNotification(reminder);
  }
  // Check for any triggers whose notifications
  // have been removed.
  const staleTriggers: TriggerNotification[] = [];
  for (const trigger of triggers) {
    if (
      reminders.findIndex((r) => trigger.notification.id?.startsWith(r.id)) ===
      -1
    ) {
      staleTriggers.push(trigger);
    }
  }
  // Remove any stale triggers that are pending
  staleTriggers.forEach(
    (trigger) =>
      trigger.notification.id &&
      notifee.cancelTriggerNotification(trigger.notification.id as string)
  );
  updateRemindersForWidget();
}

async function pinNote(id: string) {
  try {
    const note = await db.notes.note(id as string);
    if (!note) return;

    let text = await convertNoteToText(note, true);
    if (!text) text = "";
    const html = text.replace(/\n/g, "<br />");
    Notifications.displayNotification({
      title: note.title,
      message: note.headline || text,
      subtitle: "",
      bigText: html,
      ongoing: true,
      actions: [strings.unpin()],
      id: note.id
    });
  } catch (e) {
    /* empty */
  }
}
const Events = {
  onUpdate: "onUpdate"
};

const Notifications = {
  init,
  displayNotification,
  clearAll,
  remove,
  get,
  getPinnedNotes,
  pinQuickNote,
  unpinQuickNote,
  scheduleNotification,
  removeScheduledNotification,
  getScheduledNotificationIds,
  checkAndRequestPermissions,
  clearAllTriggers,
  setupReminders,
  getChannelId,
  isNotePinned,
  pinNote,
  Events,
  updateRemindersForWidget
};

export default Notifications;
