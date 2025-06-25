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

import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import { TaskScheduler } from "../utils/task-scheduler";
import dayjs from "dayjs";
import Config from "../utils/config";
import { desktop } from "../common/desktop-bridge";
import {
  Reminder,
  VirtualizedGrouping,
  FilteredSelector
} from "@notesnook/core";
import { store as noteStore } from "./note-store";
import { ReminderPreviewDialog } from "../dialogs/reminder-preview-dialog";

class ReminderStore extends BaseStore<ReminderStore> {
  reminders: VirtualizedGrouping<Reminder> | undefined = undefined;

  refresh = async (reset = true) => {
    const reminders = db.reminders.all;
    this.set({
      reminders: await reminders.grouped(
        db.settings.getGroupOptions("reminders")
      )
    });
    if (reset) {
      await resetReminders(reminders);
      await noteStore.refresh();
    }
  };

  delete = async (...ids: string[]) => {
    await db.reminders.remove(...ids);
    this.refresh();
  };
}

const [useStore, store] = createStore<ReminderStore>(
  (set, get) => new ReminderStore(set, get)
);
export { useStore, store };

async function resetReminders(reminders: FilteredSelector<Reminder>) {
  await TaskScheduler.stopAllWithPrefix("reminder:");

  if (
    !IS_TESTING &&
    (!("Notification" in window) || Notification.permission !== "granted")
  )
    return;

  for await (const reminder of reminders.iterate()) {
    if (reminder.disabled) continue;

    // set a one time reminder at the snoozed date
    if (reminder.snoozeUntil && reminder.snoozeUntil > Date.now()) {
      await scheduleReminder(
        `${reminder.id}-snoozed`,
        reminder,
        reminderToCronExpression({
          ...reminder,
          mode: "once",
          date: reminder.snoozeUntil
        })
      );
    }

    await scheduleReminder(
      reminder.id,
      reminder,
      reminderToCronExpression(reminder)
    );
  }
}

function scheduleReminder(id: string, reminder: Reminder, cron: string) {
  return TaskScheduler.register(`reminder:${id}`, cron, async () => {
    if (!Config.get("reminderNotifications", true)) return;

    if (IS_TESTING) {
      window.confirm("Reminder activated!");
      return;
    }

    if (IS_DESKTOP_APP) {
      const tag = await desktop?.integration.showNotification.query({
        title: reminder.title,
        body: reminder.description ?? "",
        silent: reminder.priority === "silent",
        timeoutType: reminder.priority === "urgent" ? "never" : "default",
        urgency:
          reminder.priority === "urgent"
            ? "critical"
            : reminder.priority === "vibrate"
            ? "normal"
            : "low",
        tag: id
      });

      if (tag) {
        await desktop?.integration.bringToFront.query();
        await ReminderPreviewDialog.show({ reminder });
      }
    } else {
      const notification = new Notification(reminder.title, {
        body: reminder.description,
        // vibrate: reminder.priority === "vibrate" ? 200 : undefined,
        silent: reminder.priority === "silent",
        tag: id,
        // renotify: true,
        requireInteraction: true
      });

      notification.onclick = function () {
        window.focus();
        ReminderPreviewDialog.show({ reminder });
      };
    }

    store.refresh(false);
  });
}

function reminderToCronExpression(reminder: Reminder) {
  const { date, recurringMode, selectedDays, mode } = reminder;
  const dateTime = dayjs(date);

  if (mode === "once" || !selectedDays) {
    return dateTime.format("00 mm HH DD MM * YYYY");
  } else {
    const cron = dateTime.format("00 mm HH").split(" ");
    if (recurringMode === "year") {
      cron.push(`${dateTime.date()}`); // day of month
      cron.push(`${dateTime.month() + 1}`); // month
      cron.push("*"); // day of week
      cron.push("*"); // year
    } else if (recurringMode === "week") {
      cron.push("*"); // day of month
      cron.push("*"); // month
      cron.push(selectedDays.sort((a, b) => a - b).join(",")); // day of week
      cron.push("*"); // year
    } else if (recurringMode === "month") {
      cron.push(
        selectedDays
          .sort((a, b) => a - b)
          .map((a) => ++a)
          .join(",")
      ); // day of month
      cron.push("*"); // month
      cron.push("*"); // day of week
      cron.push("*"); // year
    } else if (recurringMode === "day") {
      cron.push("*"); // day of month
      cron.push("*"); // month
      cron.push("*"); // day of week
      cron.push("*"); // year
    }
    return cron.join(" ");
  }
}
