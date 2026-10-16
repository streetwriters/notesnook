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

import {
  createIsReminderActiveQuery,
  createUpcomingReminderTimeQuery,
  formatReminderTime,
  getUpcomingReminderTime,
  isReminderActive
} from "../src/collections/reminders.ts";
import MockDate from "mockdate";
import { describe, afterAll, beforeEach, test, expect } from "vitest";
import { databaseTest } from "./utils/index.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import assert from "assert";

dayjs.extend(utc);

describe("format reminder time", () => {
  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(() => {
    MockDate.set(new Date(2022, 5, 6, 5, 5, 0, 0));
  });

  test("daily reminder [today]", async () => {
    const reminder = {
      recurringMode: "day",
      date: new Date(0).setHours(14),
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 02:00 PM");
  });

  test("daily reminder [tomorrow]", async () => {
    const reminder = {
      recurringMode: "day",
      date: new Date(0).setHours(3),
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 03:00 AM");
  });

  test("weekly reminder [current week]", async () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(8),
      selectedDays: [3, 5],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Wed, 08-06-2022 08:00 AM"
    );
  });

  test("weekly reminder [next week]", async () => {
    const reminder = {
      recurringMode: "week",
      date: dayjs().hour(3).valueOf(),
      selectedDays: [0],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Sun, 12-06-2022 03:05 AM"
    );
  });

  test("weekly reminder [current week, multiple days]", async () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(8),
      selectedDays: [0, 5, 6],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Fri, 10-06-2022 08:00 AM"
    );
  });

  test("weekly reminder [current week, today]", async () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(21),
      selectedDays: [0, 1],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test("weekly reminder [current week, today with multiple days]", async () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(5).setHours(21),
      selectedDays: [1, 2, 5, 6],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test("weekly reminder [current week, tomorrow]", async () => {
    MockDate.set(new Date(2024, 0, 9, 17, 0, 0, 0));
    const reminder = {
      recurringMode: "week",
      date: new Date().setHours(7),
      selectedDays: [1, 2, 3, 4],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 07:00 AM");
  });

  test("monthly reminder [current month]", async () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(8),
      selectedDays: [12, 18],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Sun, 12-06-2022 08:00 AM"
    );
  });

  test("monthly reminder [current month, tomorrow]", async () => {
    MockDate.set(new Date(2024, 0, 9, 17, 0, 0, 0));
    const reminder = {
      recurringMode: "month",
      date: new Date().setHours(7),
      selectedDays: [8, 9, 10, 11, 12],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 07:00 AM");
  });

  test("monthly reminder [next month]", async () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(3),
      selectedDays: [1, 2, 3],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Fri, 01-07-2022 03:00 AM"
    );
  });

  test("monthly reminder [current month, today]", async () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(21),
      selectedDays: [6],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test("monthly reminder [current month, today with multiple days]", async () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(21),
      selectedDays: [6, 7, 8],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test.each([
    // [now, selectedDays, expected]
    [new Date(2026, 3, 15, 5), [31], new Date(2026, 3, 30, 9)],
    [new Date(2026, 3, 30, 10), [31], new Date(2026, 4, 31, 9)],
    [new Date(2026, 0, 31, 10), [31], new Date(2026, 1, 28, 9)],
    [new Date(2026, 0, 31, 10), [30, 31], new Date(2026, 1, 28, 9)],
    [new Date(2026, 1, 20, 5), [15, 30], new Date(2026, 1, 28, 9)]
  ])(
    "monthly reminder [day beyond month length] (now: %s, days: %s)",
    async (now, selectedDays, expected) => {
      MockDate.set(now);
      const reminder = {
        recurringMode: "month",
        date: new Date(0).setHours(9),
        selectedDays,
        mode: "repeat",
        title: "Random reminder"
      };

      expect(getUpcomingReminderTime(reminder)).toBe(expected.getTime());
      expect(await compareReminder(reminder)).toBe(true);
    }
  );

  test.each([
    // [recurringMode, selectedDays, expected]
    ["month", [15, 5], new Date(2026, 3, 5, 9)],
    ["month", [2, 1], new Date(2026, 4, 1, 9)],
    ["week", [6, 5], new Date(2026, 3, 3, 9)],
    ["week", [2, 1], new Date(2026, 3, 6, 9)]
  ])(
    "%sly reminder [unsorted selected days: %s]",
    async (recurringMode, selectedDays, expected) => {
      // Fri, 3 Apr 2026
      MockDate.set(new Date(2026, 3, 3, 5));
      const reminder = {
        recurringMode,
        date: new Date(0).setHours(9),
        selectedDays,
        mode: "repeat",
        title: "Random reminder"
      };

      expect(await compareReminder(reminder)).toBe(true);
      expect(getUpcomingReminderTime(reminder)).toBe(expected.getTime());
    }
  );

  test("today", async () => {
    const reminder = {
      date: new Date(2022, 5, 6, 8, 5).getTime(),
      mode: "once",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 08:05 AM");
  });

  test("tomorrow", async () => {
    const reminder = {
      date: new Date(2022, 5, 7, 8, 5).getTime(),
      mode: "once",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 08:05 AM");
  });

  test("yesterday", async () => {
    const reminder = {
      date: new Date(2022, 5, 5, 8, 5).getTime(),
      mode: "once",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Last: Yesterday, 08:05 AM");
  });

  test("exactly on time", async () => {
    const reminder = {
      date: new Date(2022, 5, 6, 5, 5).getTime(),
      mode: "once",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Last: Today, 05:05 AM");
  });

  test("past but still on the same day", async () => {
    const reminder = {
      date: new Date(2022, 5, 6, 3, 5).getTime(),
      mode: "once",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Last: Today, 03:05 AM");
  });

  test("the exact current time tomorrow", async () => {
    const reminder = {
      date: new Date(2022, 5, 6, 5, 5).getTime(),
      mode: "repeat",
      recurringMode: "day",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 05:05 AM");
  });

  test("same day next week because time has passed today", async () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(3),
      selectedDays: [1],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Mon, 13-06-2022 03:00 AM"
    );
  });

  test("yearly reminder [this year]", async () => {
    const reminder = {
      recurringMode: "year",
      date: dayjs().month(7).date(20).hour(5).minute(5).valueOf(),
      selectedDays: [],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Sat, 20-08-2022 05:05 AM"
    );
  });

  test("yearly reminder [next year]", async () => {
    const reminder = {
      recurringMode: "year",
      date: dayjs().month(2).date(20).hour(5).minute(5).valueOf(),
      selectedDays: [],
      mode: "repeat",
      title: "Random reminder"
    };

    expect(await compareReminder(reminder)).toBe(true);
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Mon, 20-03-2023 05:05 AM"
    );
  });
});

test("sorting reminders by dateEdited shouldn't throw", () =>
  databaseTest().then(async (db) => {
    await db.reminders.add({
      recurringMode: "day",
      date: new Date(0).setHours(14),
      mode: "repeat",
      title: "Random reminder"
    });
    await expect(
      db.reminders.all.ids({
        groupBy: "default",
        sortBy: "dateEdited",
        sortDirection: "desc"
      })
    ).resolves.toBeDefined();
    await expect(
      db.reminders.all.groups({
        groupBy: "default",
        sortBy: "dateEdited",
        sortDirection: "desc"
      })
    ).resolves.toBeDefined();
    await expect(
      db.reminders.all
        .grouped({
          groupBy: "default",
          sortBy: "dateEdited",
          sortDirection: "desc"
        })
        .then((g) => g.item(0))
    ).resolves.toBeDefined();
  }));

test("upcoming reminder time matches between js & sql", async () => {
  const db = await databaseTest();
  // simple seeded rng so failures are reproducible
  let seed = 42;
  const random = (n) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return (seed >>> 8) % n;
  };

  const mismatches = [];
  for (let i = 0; i < 500; i++) {
    const recurringMode = ["day", "week", "month", "year"][random(4)];
    const now = new Date(
      2024 + random(3),
      random(12),
      1 + random(31),
      random(24),
      random(60)
    );
    MockDate.set(now);

    const selectedDays = Array.from({ length: random(4) }, () =>
      recurringMode === "week" ? random(7) : 1 + random(31)
    );
    const reminder = {
      recurringMode,
      date: new Date(
        2025,
        random(12),
        1 + random(31),
        random(24),
        random(60)
      ).getTime(),
      selectedDays: [...new Set(selectedDays)],
      mode: "repeat",
      title: "Random reminder"
    };

    const id = await db.reminders.add(reminder);
    const { dueDate } = await db
      .sql()
      .selectFrom("reminders")
      .select(
        createUpcomingReminderTimeQuery(
          dayjs().utc().format("YYYY-MM-DDTHH:mm")
        ).as("dueDate")
      )
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
    const expected = getUpcomingReminderTime(reminder);
    if (dueDate !== expected)
      mismatches.push({
        now: now.toString(),
        reminder,
        sql: new Date(dueDate).toString(),
        js: new Date(expected).toString()
      });
  }
  MockDate.reset();

  expect(mismatches).toEqual([]);
});

async function compareReminder(reminder) {
  const db = await databaseTest();
  const id = await db.reminders.add(reminder);
  const result = await db
    .sql()
    .selectFrom("reminders")
    .select([
      createUpcomingReminderTimeQuery(
        dayjs().utc().format("YYYY-MM-DDTHH:mm")
      ).as("dueDate"),
      createIsReminderActiveQuery(dayjs.utc().format("YYYY-MM-DDTHH:mm")).as(
        "isActive"
      ),
      "id"
    ])
    .where("id", "=", id)
    .executeTakeFirst();

  assert(
    result.isActive === Number(isReminderActive(reminder)),
    "is active value is not equal"
  );
  return (
    result.dueDate ===
    dayjs(getUpcomingReminderTime(reminder)).second(0).millisecond(0).valueOf()
  );
}
