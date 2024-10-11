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

import { Reminder } from "@notesnook/core";
import { test, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";

const ONE_TIME_REMINDER: Partial<Reminder> = {
  title: "Test reminder 1",
  description: "I am a description",
  date: 1 * 60 * 1000,
  mode: "once",
  priority: "urgent"
};

test("add a one-time reminder", async ({ page }, info) => {
  info.setTimeout(90 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();

  const reminder = await reminders.createReminderAndWait(ONE_TIME_REMINDER);

  expect(reminder).toBeDefined();

  page.on("dialog", (dialog) => dialog.accept());
  await page.waitForEvent("dialog");
});

test("adding a one-time reminder before current time should not be possible", async ({
  page
}, info) => {
  info.setTimeout(90 * 1000);

  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();

  await reminders.createReminder({
    ...ONE_TIME_REMINDER,
    date: 0
  });

  expect(
    await app.toasts.waitForToast(
      "Reminder time cannot be earlier than the current time."
    )
  ).toBeTruthy();
});

for (const recurringMode of ["Daily", "Weekly", "Monthly"] as const) {
  test(`add a recurring reminder (${recurringMode})`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();
    const reminders = await app.goToReminders();

    const reminder = await reminders.createReminderAndWait({
      ...ONE_TIME_REMINDER,
      mode: "repeat",
      recurringMode:
        recurringMode === "Daily"
          ? "day"
          : recurringMode === "Weekly"
          ? "week"
          : "month",
      selectedDays: [1, 2]
    });

    expect(reminder).toBeDefined();
    expect(await reminder?.getRecurringMode()).toBe(recurringMode);
  });
}

test(`add a recurring reminder before current time`, async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();

  const reminder = await reminders.createReminderAndWait({
    ...ONE_TIME_REMINDER,
    mode: "repeat",
    recurringMode: "day",
    date: 0
  });

  expect(reminder).toBeDefined();
});

test("delete a reminder", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();
  const reminder = await reminders.createReminderAndWait(ONE_TIME_REMINDER);

  await reminder?.delete();

  expect(await reminder?.isPresent()).toBe(false);
});

test("edit a reminder", async ({ page }) => {
  const EDITED_REMINDER: Partial<Reminder> = {
    ...ONE_TIME_REMINDER,
    title: "Edited reminder title",
    description: "An edited description",
    date: 32 * 60 * 1000
  };

  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();
  const reminder = await reminders.createReminderAndWait(ONE_TIME_REMINDER);
  const beforeReminderTime = await reminder?.getReminderTime();
  const beforeDescription = await reminder?.getDescription();
  const beforeTitle = await reminder?.getTitle();

  await reminder?.edit(EDITED_REMINDER);

  expect(await reminder?.isPresent()).toBe(true);
  expect(await reminder?.getReminderTime()).not.toBe(beforeReminderTime);
  expect(await reminder?.getDescription()).not.toBe(beforeDescription);
  expect(await reminder?.getTitle()).not.toBe(beforeTitle);
  expect(
    await reminders.findReminder({ title: EDITED_REMINDER.title })
  ).toBeDefined();
});

test("disable a reminder", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();
  const reminder = await reminders.createReminderAndWait(ONE_TIME_REMINDER);

  await reminder?.toggle();

  expect(await reminder?.isPresent()).toBe(true);
  expect(await reminders.findGroup("Inactive")).toBeDefined();
  expect(await reminder?.isDisabled()).toBeTruthy();
});

test("enable a disabled reminder", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();
  const reminder = await reminders.createReminderAndWait(ONE_TIME_REMINDER);
  await reminder?.toggle();

  await reminder?.toggle();

  expect(await reminder?.isPresent()).toBe(true);
  expect(await reminders.findGroup("Active")).toBeDefined();
  expect(await reminder?.isDisabled()).toBeFalsy();
});

test("editing a weekly recurring reminder should not revert it to daily", async ({
  page
}) => {
  const RECURRING_REMINDER: Partial<Reminder> = {
    ...ONE_TIME_REMINDER,
    recurringMode: "week",
    selectedDays: [0, 2],
    mode: "repeat"
  };

  const app = new AppModel(page);
  await app.goto();
  const reminders = await app.goToReminders();
  const reminder = await reminders.createReminderAndWait(RECURRING_REMINDER);

  await reminder?.edit({
    description: "An edited reminder"
  });

  expect(await reminder?.isPresent()).toBe(true);
  expect(await reminder?.getRecurringMode()).toBe("Weekly");
  expect(await reminder?.getDescription()).toBe("An edited reminder");
});
