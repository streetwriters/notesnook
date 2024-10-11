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

import { bench, describe } from "vitest";
import { databaseTest } from "../__tests__/utils/index.js";
import Database from "../src/api/index.js";
import MockDate from "mockdate";
import dayjs from "dayjs";
import { Reminder } from "../src/types.js";
import {
  createUpcomingReminderTimeQuery,
  getUpcomingReminderTime
} from "../src/collections/reminders.js";

async function addReminders(db: Database) {
  const reminders: Partial<Reminder>[] = [
    {
      recurringMode: "day",
      date: new Date(0).setHours(14),
      mode: "repeat"
    },
    {
      recurringMode: "day",
      date: new Date(0).setHours(3),
      mode: "repeat",
      title: "Random reminder"
    },
    {
      recurringMode: "week",
      date: new Date(0).setHours(8),
      selectedDays: [3, 5],
      mode: "repeat"
    },
    {
      recurringMode: "week",
      date: dayjs().hour(3).valueOf(),
      selectedDays: [0],
      mode: "repeat"
    },
    {
      recurringMode: "week",
      date: new Date(0).setHours(8),
      selectedDays: [0, 5, 6],
      mode: "repeat"
    },
    {
      recurringMode: "week",
      date: new Date(0).setHours(21),
      selectedDays: [0, 1],
      mode: "repeat"
    },
    {
      recurringMode: "week",
      date: new Date(5).setHours(21),
      selectedDays: [1, 2, 5, 6],
      mode: "repeat"
    },
    {
      recurringMode: "month",
      date: new Date(0).setHours(8),
      selectedDays: [12, 18],
      mode: "repeat"
    },
    {
      recurringMode: "month",
      date: new Date(0).setHours(3),
      selectedDays: [1, 2, 3],
      mode: "repeat"
    },
    {
      recurringMode: "month",
      date: new Date(0).setHours(21),
      selectedDays: [6],
      mode: "repeat"
    },
    {
      recurringMode: "month",
      date: new Date(0).setHours(21),
      selectedDays: [6, 7, 8],
      mode: "repeat"
    },
    {
      date: new Date(2022, 5, 6, 8, 5).getTime(),
      mode: "once"
    },
    {
      date: new Date(2022, 5, 7, 8, 5).getTime(),
      mode: "once"
    },
    {
      date: new Date(2022, 5, 5, 8, 5).getTime(),
      mode: "once"
    },
    {
      date: new Date(2022, 5, 6, 5, 5).getTime(),
      mode: "once"
    },
    {
      date: new Date(2022, 5, 6, 3, 5).getTime(),
      mode: "once"
    },
    {
      date: new Date(2022, 5, 6, 5, 5).getTime(),
      mode: "repeat",
      recurringMode: "day"
    },
    {
      recurringMode: "week",
      date: new Date(0).setHours(3),
      selectedDays: [1],
      mode: "repeat"
    },
    {
      recurringMode: "year",
      date: dayjs().month(7).date(20).hour(5).minute(5).valueOf(),
      selectedDays: [],
      mode: "repeat"
    },
    {
      recurringMode: "year",
      date: dayjs().month(2).date(20).hour(5).minute(5).valueOf(),
      selectedDays: [],
      mode: "repeat"
    }
  ];
  for (let i = 0; i < 10000; ++i) {
    const random = reminders[getRandom(0, reminders.length)];
    if (!random) continue;
    await db.reminders.add({
      title: "Random reminder",
      ...random
    });
    if (i % 100 === 0) console.log(i);
  }
  console.log("DONE");
}

describe("reminders", async () => {
  MockDate.set(new Date(2022, 5, 6, 5, 5, 0, 0));

  const db = await databaseTest();
  await addReminders(db);

  bench("derive due date in sqlite", async () => {
    await db
      .sql()
      .selectFrom("reminders")
      .select([
        createUpcomingReminderTimeQuery(dayjs().format("YYYY-MM-DDTHH:mm")).as(
          "dueDate"
        )
      ])
      .execute();
  });

  bench("derive due date in js", async () => {
    const reminders = (await db
      .sql()
      .selectFrom("reminders")
      .select(["type", "date", "mode", "recurringMode", "date", "selectedDays"])
      .execute()) as Reminder[];
    reminders.map((r) => getUpcomingReminderTime(r));
  });

  MockDate.reset();
});

function getRandom(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}
