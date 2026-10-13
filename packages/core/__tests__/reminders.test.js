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
  createReminderGroupQuery,
  createUpcomingReminderTimeQuery,
  formatReminderTime,
  getReminderGroup,
  getUpcomingReminder,
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

/**
 * Times in the tests below are written as local, 24-hour "YYYY-MM-DD HH:mm".
 */
function at(str) {
  return new Date(str.replace(" ", "T")).getTime();
}

/**
 * "Now" for the tests below: Monday 1 Jan 2024, 12:00 (noon).
 *
 * January 2024 starts on a Monday, so in its first week the date matches the
 * JS weekday number used by weekly `selectedDays`:
 *   Mon 1 = 1, Tue 2 = 2, Wed 3 = 3, Thu 4 = 4, Fri 5 = 5, Sat 6 = 6,
 *   Sun 7 = 0 (Sunday is 0, not 7)
 * The week before: Fri 29 Dec 2023, Sat 30 Dec, Sun 31 Dec.
 */
const NOW = at("2024-01-01 12:00");

function daily(date) {
  return {
    title: "daily",
    mode: "repeat",
    recurringMode: "day",
    date: at(date)
  };
}

function weekly(date, selectedDays) {
  return {
    title: "weekly",
    mode: "repeat",
    recurringMode: "week",
    date: at(date),
    selectedDays
  };
}

function monthly(date, selectedDays) {
  return {
    title: "monthly",
    mode: "repeat",
    recurringMode: "month",
    date: at(date),
    selectedDays
  };
}

function yearly(date) {
  return {
    title: "yearly",
    mode: "repeat",
    recurringMode: "year",
    date: at(date)
  };
}

function once(date, fields) {
  return { title: "once", mode: "once", date: at(date), ...fields };
}

describe("getUpcomingReminderTime", () => {
  beforeEach(() => MockDate.set(NOW));
  afterAll(() => MockDate.reset());

  test("once reminder returns its date", () => {
    expect(getUpcomingReminderTime(once("2023-12-20 10:00"))).toBe(
      at("2023-12-20 10:00")
    );
  });

  test("daily reminder later today", () => {
    expect(getUpcomingReminderTime(daily("2023-12-01 14:00"))).toBe(
      at("2024-01-01 14:00")
    );
  });

  test("daily reminder already passed today", () => {
    expect(getUpcomingReminderTime(daily("2023-12-01 09:00"))).toBe(
      at("2024-01-02 09:00")
    );
  });

  test("daily reminder starting in the future returns the start date", () => {
    expect(getUpcomingReminderTime(daily("2024-01-04 09:00"))).toBe(
      at("2024-01-04 09:00")
    );
  });

  test("daily reminder starting right now moves to the next day", () => {
    expect(getUpcomingReminderTime(daily("2024-01-01 12:00"))).toBe(
      at("2024-01-02 12:00")
    );
  });

  test("daily reminder starting later today returns the start date", () => {
    expect(getUpcomingReminderTime(daily("2024-01-01 15:00"))).toBe(
      at("2024-01-01 15:00")
    );
  });

  test("daily reminder with explicit `from` returns the next occurrence", () => {
    const reminder = daily("2024-01-04 09:00");
    expect(getUpcomingReminderTime(reminder, at("2024-01-05 09:00"))).toBe(
      at("2024-01-06 09:00")
    );
  });

  test("explicit `from` before the start date returns the start date", () => {
    const reminder = daily("2024-01-04 09:00");
    expect(getUpcomingReminderTime(reminder, at("2024-01-02 09:00"))).toBe(
      at("2024-01-04 09:00")
    );
    expect(getUpcomingReminderTime(reminder, 0)).toBe(at("2024-01-04 09:00"));
  });

  test("weekly reminder picks the next selected day", () => {
    // Wed & Fri
    expect(getUpcomingReminderTime(weekly("2023-12-01 09:00", [3, 5]))).toBe(
      at("2024-01-03 09:00")
    );
  });

  test("weekly reminder whose time has passed today wraps to the next week", () => {
    // Mon, already passed at 09:00
    expect(getUpcomingReminderTime(weekly("2023-12-01 09:00", [1]))).toBe(
      at("2024-01-08 09:00")
    );
  });

  test("weekly reminder on Sunday", () => {
    // Sun = 0
    expect(getUpcomingReminderTime(weekly("2023-12-01 09:00", [0]))).toBe(
      at("2024-01-07 09:00")
    );
  });

  test("weekly reminder starting in the future on a selected day", () => {
    // starts Wed 10 Jan; Wed & Fri selected
    expect(getUpcomingReminderTime(weekly("2024-01-10 09:00", [3, 5]))).toBe(
      at("2024-01-10 09:00")
    );
  });

  test("weekly reminder starting in the future on a non-selected day", () => {
    // starts Wed 10 Jan; only Fri selected
    expect(getUpcomingReminderTime(weekly("2024-01-10 09:00", [5]))).toBe(
      at("2024-01-12 09:00")
    );
  });

  test("monthly reminder picks the next selected date", () => {
    expect(getUpcomingReminderTime(monthly("2023-12-01 09:00", [10, 20]))).toBe(
      at("2024-01-10 09:00")
    );
  });

  test("monthly reminder whose time has passed today wraps to next month", () => {
    // the 1st, already passed at 09:00
    expect(getUpcomingReminderTime(monthly("2023-12-01 09:00", [1]))).toBe(
      at("2024-02-01 09:00")
    );
  });

  test("monthly reminder starting in the future", () => {
    expect(getUpcomingReminderTime(monthly("2024-02-05 09:00", [15]))).toBe(
      at("2024-02-15 09:00")
    );
  });

  test("yearly reminder later this year", () => {
    expect(getUpcomingReminderTime(yearly("2020-12-25 09:00"))).toBe(
      at("2024-12-25 09:00")
    );
  });

  test("yearly reminder whose time has passed today moves to next year", () => {
    expect(getUpcomingReminderTime(yearly("2020-01-01 09:00"))).toBe(
      at("2025-01-01 09:00")
    );
  });

  test("yearly reminder starting in the future returns the start date", () => {
    expect(getUpcomingReminderTime(yearly("2025-06-15 09:00"))).toBe(
      at("2025-06-15 09:00")
    );
  });
});

describe("reminder groups", () => {
  beforeEach(() => MockDate.set(NOW));
  afterAll(() => MockDate.reset());

  const GROUPS = ["Upcoming", "Past", "Disabled", "Completed"];
  const yesterday = "2023-12-31 09:00";
  const tomorrow = "2024-01-02 09:00";

  test("group is derived from trigger time, disabled and completedAt", () => {
    expect(getReminderGroup(once(tomorrow))).toBe("Upcoming");
    expect(getReminderGroup(once(yesterday))).toBe("Past");
    expect(getReminderGroup(once(yesterday, { disabled: true }))).toBe(
      "Disabled"
    );
    expect(getReminderGroup(once(tomorrow, { disabled: true }))).toBe(
      "Disabled"
    );
    expect(
      getReminderGroup(once(yesterday, { snoozeUntil: at(tomorrow) }))
    ).toBe("Upcoming");
    expect(getReminderGroup(once(yesterday, { completedAt: NOW }))).toBe(
      "Completed"
    );
    expect(getReminderGroup(once(tomorrow, { completedAt: NOW }))).toBe(
      "Completed"
    );
    expect(
      getReminderGroup(once(tomorrow, { completedAt: NOW, disabled: true }))
    ).toBe("Completed");
    expect(getReminderGroup(daily(yesterday))).toBe("Upcoming");
    expect(getReminderGroup({ ...daily(yesterday), disabled: true })).toBe(
      "Disabled"
    );
  });

  test("SQL group matches JS group", async () => {
    const db = await databaseTest();
    const cases = [
      once(tomorrow),
      once(yesterday),
      once(yesterday, { disabled: true }),
      once(tomorrow, { disabled: true }),
      once(yesterday, { snoozeUntil: at(tomorrow) }),
      once(yesterday, { completedAt: NOW }),
      once(tomorrow, { completedAt: NOW }),
      once(tomorrow, { completedAt: NOW, disabled: true }),
      daily(yesterday),
      { ...daily(yesterday), disabled: true }
    ];
    for (const reminder of cases) {
      const id = await db.reminders.add(reminder);
      const row = await db
        .sql()
        .selectFrom("reminders")
        .select(
          createReminderGroupQuery(dayjs().utc().format("YYYY-MM-DDTHH:mm")).as(
            "g"
          )
        )
        .where("id", "=", id)
        .executeTakeFirst();
      expect(GROUPS[row.g]).toBe(getReminderGroup(reminder));
    }
  });

  test("grouped list returns Upcoming, Past, Disabled, Completed in order", async () => {
    // grouping runs in SQLite on the real clock, see "sorting reminders by due date"
    MockDate.reset();
    const db = await databaseTest();
    await db.reminders.add(
      once("2099-01-01 09:00", { title: "c", completedAt: Date.now() })
    );
    await db.reminders.add(once("2000-01-01 09:00", { title: "p" }));
    await db.reminders.add(once("2099-01-01 09:00", { title: "u" }));
    await db.reminders.add(
      once("2099-01-01 09:00", { title: "d", disabled: true })
    );
    const groups = await db.reminders.all.groups({
      groupBy: "default",
      sortBy: "dueDate",
      sortDirection: "asc"
    });
    expect(groups.map((g) => g.group.title)).toEqual(GROUPS);
  });
});

describe("getUpcomingReminder", () => {
  beforeEach(() => MockDate.set(NOW));
  afterAll(() => MockDate.reset());

  // next occurrence: today 14:00
  const daily14 = () => daily("2023-12-01 14:00");

  test("empty list returns undefined", () => {
    expect(getUpcomingReminder([])).toBeUndefined();
  });

  test("single reminder is returned as is", () => {
    const r = once("2024-01-02 09:00");
    expect(getUpcomingReminder([r])).toBe(r);
  });

  test("returns the earliest of several once reminders", () => {
    const thu = once("2024-01-04 09:00");
    const tue = once("2024-01-02 09:00");
    const wed = once("2024-01-03 09:00");
    expect(getUpcomingReminder([thu, tue, wed])).toBe(tue);
  });

  test("repeating reminder is ranked by its next occurrence, not its stored date", () => {
    const today14 = daily14();
    const tomorrow09 = once("2024-01-02 09:00");
    expect(getUpcomingReminder([tomorrow09, today14])).toBe(today14);
  });

  test("once reminder wins over a repeating reminder with a later occurrence", () => {
    const today14 = daily14();
    const today13 = once("2024-01-01 13:00");
    expect(getUpcomingReminder([today14, today13])).toBe(today13);
  });

  test("repeating reminders compare by next occurrence", () => {
    const today21 = daily("2023-12-01 21:00");
    const tomorrow09 = daily("2023-12-01 09:00"); // today's 09:00 has passed
    const today15 = daily("2023-12-01 15:00");
    expect(getUpcomingReminder([tomorrow09, today21, today15])).toBe(today15);
  });

  test("weekly and monthly reminders use their next selected occurrence", () => {
    const wed = weekly("2023-12-01 09:00", [3]); // Wed 3 Jan
    const second = monthly("2023-12-01 09:00", [2]); // Tue 2 Jan
    expect(getUpcomingReminder([wed, second])).toBe(second);
  });

  test("repeating reminder starting in the future uses its start date", () => {
    const from20th = daily("2024-01-20 09:00");
    const on10th = once("2024-01-10 09:00");
    expect(getUpcomingReminder([from20th, on10th])).toBe(on10th);
  });

  test("the earlier of two ties keeps its position", () => {
    const a = once("2024-01-02 09:00");
    const b = once("2024-01-02 09:00");
    expect(getUpcomingReminder([a, b])).toBe(a);
  });

  test("a past once reminder is never the upcoming one", () => {
    const past = once("2023-12-31 09:00");
    const next = once("2024-01-02 09:00");
    expect(getUpcomingReminder([next, past])).toBe(next);
  });

  test("returns undefined when only past once reminders exist", () => {
    const yesterday = once("2023-12-31 09:00");
    const rightNow = once("2024-01-01 12:00");
    expect(getUpcomingReminder([yesterday, rightNow])).toBeUndefined();
  });

  test("a past once reminder does not hide repeating reminders", () => {
    const past = once("2023-12-31 09:00");
    const today14 = daily14();
    expect(getUpcomingReminder([past, today14])).toBe(today14);
  });

  test("a completed reminder is never the upcoming one", () => {
    const completed = once("2024-01-01 13:00", { completedAt: NOW });
    const today14 = daily14();
    expect(getUpcomingReminder([completed, today14])).toBe(today14);
  });

  test("an enabled reminder is preferred over an earlier disabled one", () => {
    const disabled = once("2024-01-01 13:00", { disabled: true });
    const today14 = daily14();
    expect(getUpcomingReminder([disabled, today14])).toBe(today14);
    expect(getUpcomingReminder([disabled])).toBe(disabled);
  });

  test("a past or completed disabled reminder is never the upcoming one", () => {
    const past = once("2023-12-31 09:00", { disabled: true });
    const completed = once("2024-01-02 09:00", {
      disabled: true,
      completedAt: NOW
    });
    const future = once("2024-01-03 09:00", { disabled: true });
    expect(getUpcomingReminder([past, completed])).toBeUndefined();
    expect(getUpcomingReminder([past, completed, future])).toBe(future);
  });

  test("a snoozed once reminder is ranked by its snooze time", () => {
    // was due yesterday, snoozed until today 13:00
    const snoozed = once("2023-12-31 09:00", {
      snoozeUntil: at("2024-01-01 13:00")
    });
    const today14 = daily14();
    expect(getUpcomingReminder([today14, snoozed])).toBe(snoozed);
  });

  test("does not mutate selectedDays", () => {
    const reminder = weekly("2023-12-01 09:00", [5, 3]);
    getUpcomingReminder([reminder]);
    expect(reminder.selectedDays).toEqual([5, 3]);
  });
});

describe("markComplete", () => {
  beforeEach(() => MockDate.set(NOW));
  afterAll(() => MockDate.reset());

  async function allReminders(db) {
    return db
      .sql()
      .selectFrom("reminders")
      .select([
        "id",
        "mode",
        "title",
        "date",
        "completedAt",
        "snoozeUntil",
        "recurringMode",
        "selectedDays",
        "disabled"
      ])
      .execute();
  }

  async function complete(reminder, occurrence) {
    const db = await databaseTest();
    const id = await db.reminders.add(reminder);
    await db.reminders.markComplete(id, occurrence);
    return { db, id, ...(await split(db, id)) };
  }

  async function split(db, id) {
    const rows = await allReminders(db);
    return {
      original: rows.find((r) => r.id === id),
      duplicates: rows.filter((r) => r.id !== id)
    };
  }

  test("once reminder is marked completed in place", async () => {
    const { original, duplicates } = await complete(once("2024-01-02 09:00"));
    expect(duplicates).toHaveLength(0);
    expect(original.completedAt).toBe(NOW);
    expect(original.date).toBe(at("2024-01-02 09:00"));
  });

  test("once reminder drops its snooze when completed", async () => {
    const { original } = await complete(
      once("2024-01-01 09:00", { snoozeUntil: at("2024-01-01 13:00") })
    );
    expect(original.snoozeUntil).toBeFalsy();
  });

  test("an already completed once reminder can't be completed again", async () => {
    const { db, id } = await complete(once("2024-01-02 09:00"));
    MockDate.set(at("2024-01-01 13:00"));
    await expect(db.reminders.markComplete(id)).rejects.toThrow();
    expect((await split(db, id)).original.completedAt).toBe(NOW);
  });

  test("permanent reminder is left untouched", async () => {
    const { original, duplicates } = await complete({
      title: "ongoing",
      mode: "permanent",
      date: at("2023-12-01 09:00")
    });
    expect(duplicates).toHaveLength(0);
    expect(original.completedAt).toBeFalsy();
    expect(original.date).toBe(at("2023-12-01 09:00"));
  });

  test("daily reminder completes today's occurrence and moves to tomorrow", async () => {
    // today's 09:00 triggered, user completes it at 12:00
    const { original, duplicates } = await complete(daily("2024-01-01 09:00"));

    expect(original.mode).toBe("repeat");
    expect(original.completedAt).toBeFalsy();
    expect(original.date).toBe(at("2024-01-02 09:00"));

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toMatchObject({
      mode: "once",
      title: "daily",
      date: at("2024-01-01 09:00"),
      completedAt: NOW
    });
  });

  test("duplicate doesn't keep repeat settings, snooze or disabled", async () => {
    const { duplicates } = await complete({
      ...weekly("2024-01-01 09:00", [1, 3]),
      snoozeUntil: at("2024-01-01 13:00"),
      disabled: true
    });
    expect(duplicates[0].recurringMode).toBeFalsy();
    expect(duplicates[0].selectedDays).toBe("[]");
    expect(duplicates[0].snoozeUntil).toBeFalsy();
    expect(duplicates[0].disabled).toBeFalsy();
    expect(getReminderGroup(duplicates[0])).toBe("Completed");
  });

  test("completing drops the snooze from the original", async () => {
    const { original } = await complete({
      ...daily("2024-01-01 09:00"),
      snoozeUntil: at("2024-01-01 13:00")
    });
    expect(original.snoozeUntil).toBeFalsy();
  });

  test("an overdue occurrence is completed and moves to the next one, even if that is overdue too", async () => {
    // 30 Dec, 31 Dec & 1 Jan all triggered and none were completed
    const { original, duplicates } = await complete(daily("2023-12-30 09:00"));
    expect(duplicates[0].date).toBe(at("2023-12-30 09:00"));
    expect(original.date).toBe(at("2023-12-31 09:00"));
  });

  test("completing before the occurrence triggers completes it early", async () => {
    // starts 4 Jan, nothing triggered yet
    const { original, duplicates } = await complete(daily("2024-01-04 09:00"));
    expect(duplicates[0].date).toBe(at("2024-01-04 09:00"));
    expect(original.date).toBe(at("2024-01-05 09:00"));
  });

  test("an explicit later occurrence is completed, skipping earlier ones", async () => {
    // current occurrence is 30 Dec; the 1 Jan notification is completed
    const { original, duplicates } = await complete(
      daily("2023-12-30 09:00"),
      at("2024-01-01 09:00")
    );
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].date).toBe(at("2024-01-01 09:00"));
    expect(original.date).toBe(at("2024-01-02 09:00"));
  });

  test("an already completed occurrence can't be completed again", async () => {
    // 1 Jan is completed, then its stale notification is completed again
    const { db, id } = await complete(daily("2024-01-01 09:00"));
    await expect(
      db.reminders.markComplete(id, at("2024-01-01 09:00"))
    ).rejects.toThrow();

    const { original, duplicates } = await split(db, id);
    expect(duplicates).toHaveLength(1);
    expect(original.date).toBe(at("2024-01-02 09:00"));
  });

  test("a time that isn't an occurrence can't be completed", async () => {
    const db = await databaseTest();
    const id = await db.reminders.add(daily("2024-01-01 09:00"));
    await expect(
      db.reminders.markComplete(id, at("2024-01-02 10:00"))
    ).rejects.toThrow();

    const { original, duplicates } = await split(db, id);
    expect(duplicates).toHaveLength(0);
    expect(original.date).toBe(at("2024-01-01 09:00"));
  });

  test("retrying after a partial failure doesn't duplicate the occurrence", async () => {
    const { db, id } = await complete(daily("2024-01-01 09:00"));
    // simulate the original not being moved forward
    await db.reminders.add({ id, date: at("2024-01-01 09:00") });
    await db.reminders.markComplete(id);

    const { original, duplicates } = await split(db, id);
    expect(duplicates).toHaveLength(1);
    expect(original.date).toBe(at("2024-01-02 09:00"));
  });

  test("duplicate is linked to the same notes as the original", async () => {
    const db = await databaseTest();
    const noteId = await db.notes.add({ title: "Note" });
    const id = await db.reminders.add(daily("2024-01-01 09:00"));
    await db.relations.add(
      { id: noteId, type: "note" },
      { id, type: "reminder" }
    );
    await db.reminders.markComplete(id);
    const linked = await db.relations
      .from({ id: noteId, type: "note" }, "reminder")
      .get();
    expect(linked).toHaveLength(2);
  });

  test("weekly reminder moves to the next selected day", async () => {
    // Wed & Fri: completes Wed 3 Jan, next is Fri 5 Jan
    const { original, duplicates } = await complete(
      weekly("2024-01-03 09:00", [3, 5])
    );
    expect(duplicates[0].date).toBe(at("2024-01-03 09:00"));
    expect(original.date).toBe(at("2024-01-05 09:00"));
  });

  test("weekly reminder starting on a non-selected day completes the first selected day", async () => {
    // starts Mon 1 Jan, only Wed selected: completes Wed 3 Jan, next is Wed 10 Jan
    const { original, duplicates } = await complete(
      weekly("2024-01-01 09:00", [3])
    );
    expect(duplicates[0].date).toBe(at("2024-01-03 09:00"));
    expect(original.date).toBe(at("2024-01-10 09:00"));
  });

  test("monthly reminder moves to the next selected date", async () => {
    // 10th & 20th: completes 10 Jan, next is 20 Jan
    const { original, duplicates } = await complete(
      monthly("2024-01-10 09:00", [10, 20])
    );
    expect(duplicates[0].date).toBe(at("2024-01-10 09:00"));
    expect(original.date).toBe(at("2024-01-20 09:00"));
  });

  test("yearly reminder moves by a year", async () => {
    // completes the overdue 15 Jun 2023, next is 15 Jun 2024
    const { original, duplicates } = await complete(yearly("2023-06-15 09:00"));
    expect(duplicates[0].date).toBe(at("2023-06-15 09:00"));
    expect(original.date).toBe(at("2024-06-15 09:00"));
  });

  test("completing a repeating reminder twice completes two occurrences", async () => {
    // 1st: completes 1 Jan, next is 2 Jan
    // 2nd: completes 2 Jan early, next is 3 Jan
    const { db, id } = await complete(daily("2024-01-01 09:00"));
    await db.reminders.markComplete(id);

    const { original, duplicates } = await split(db, id);
    expect(duplicates.map((d) => d.date).sort((a, b) => a - b)).toEqual([
      at("2024-01-01 09:00"),
      at("2024-01-02 09:00")
    ]);
    expect(original.date).toBe(at("2024-01-03 09:00"));
  });
});

/**
 * Sorting by due date happens in SQLite, whose "now" is the real clock and
 * can't be mocked. So reminders here are dated in 2000 (always past) or 2099
 * (always upcoming), and each title says when it triggers.
 */
describe("sorting reminders by due date", () => {
  beforeEach(() => MockDate.reset());

  async function setup() {
    const db = await databaseTest();
    const add = (reminder, title) => db.reminders.add({ ...reminder, title });
    const completedAt = Date.now();

    await add(
      once("2099-01-01 08:00", { completedAt }),
      "completed, due 2099-01-01 08:00"
    );
    await add(
      once("2000-01-02 09:00", { completedAt }),
      "completed, due 2000-01-02 09:00"
    );
    await add(
      once("2000-01-01 09:00", { completedAt }),
      "completed, due 2000-01-01 09:00"
    );
    await add(once("2000-01-03 09:00"), "past 2000-01-03 09:00");
    await add(once("2000-01-02 09:00"), "past 2000-01-02 09:00");
    await add(once("2000-01-01 09:00"), "past 2000-01-01 09:00");
    await add(once("2099-01-01 11:00"), "once 2099-01-01 11:00");
    await add(once("2099-01-01 09:00"), "once 2099-01-01 09:00");
    // started long ago, so its next occurrence is within a day from now
    await add(daily("2000-01-01 09:00"), "daily since 2000, next within a day");
    const dailyId = await add(
      daily("2099-01-01 10:00"),
      "daily 10:00 from 2099-01-01"
    );
    await add(daily("2099-01-05 09:00"), "daily 09:00 from 2099-01-05");
    return { db, dailyId };
  }

  async function sortedTitles(db, sortDirection) {
    const ids = await db.reminders.all.ids({
      groupBy: "none",
      sortBy: "dueDate",
      sortDirection
    });
    const titles = [];
    for (const id of ids) titles.push((await db.reminders.reminder(id)).title);
    return titles;
  }

  test("earliest first", async () => {
    const { db } = await setup();
    expect(await sortedTitles(db, "asc")).toEqual([
      // Upcoming
      "daily since 2000, next within a day",
      "once 2099-01-01 09:00",
      "daily 10:00 from 2099-01-01",
      "once 2099-01-01 11:00",
      "daily 09:00 from 2099-01-05",
      // Past
      "past 2000-01-01 09:00",
      "past 2000-01-02 09:00",
      "past 2000-01-03 09:00",
      // Completed
      "completed, due 2000-01-01 09:00",
      "completed, due 2000-01-02 09:00",
      "completed, due 2099-01-01 08:00"
    ]);
  });

  test("latest first", async () => {
    const { db } = await setup();
    expect(await sortedTitles(db, "desc")).toEqual([
      // Upcoming
      "daily 09:00 from 2099-01-05",
      "once 2099-01-01 11:00",
      "daily 10:00 from 2099-01-01",
      "once 2099-01-01 09:00",
      "daily since 2000, next within a day",
      // Past
      "past 2000-01-03 09:00",
      "past 2000-01-02 09:00",
      "past 2000-01-01 09:00",
      // Completed
      "completed, due 2099-01-01 08:00",
      "completed, due 2000-01-02 09:00",
      "completed, due 2000-01-01 09:00"
    ]);
  });

  test("completing a daily reminder moves it behind another upcoming reminder", async () => {
    const { db, dailyId } = await setup();
    await db.reminders.markComplete(dailyId, at("2099-01-01 10:00"));

    // the original's next occurrence is now 2099-01-02 10:00 (after "once
    // 11:00"); the completed duplicate keeps the title and is due 2099-01-01 10:00
    expect(await sortedTitles(db, "asc")).toEqual([
      // Upcoming
      "daily since 2000, next within a day",
      "once 2099-01-01 09:00",
      "once 2099-01-01 11:00",
      "daily 10:00 from 2099-01-01",
      "daily 09:00 from 2099-01-05",
      // Past
      "past 2000-01-01 09:00",
      "past 2000-01-02 09:00",
      "past 2000-01-03 09:00",
      // Completed
      "completed, due 2000-01-01 09:00",
      "completed, due 2000-01-02 09:00",
      "completed, due 2099-01-01 08:00",
      "daily 10:00 from 2099-01-01"
    ]);
    expect(await sortedTitles(db, "desc")).toEqual([
      // Upcoming
      "daily 09:00 from 2099-01-05",
      "daily 10:00 from 2099-01-01",
      "once 2099-01-01 11:00",
      "once 2099-01-01 09:00",
      "daily since 2000, next within a day",
      // Past
      "past 2000-01-03 09:00",
      "past 2000-01-02 09:00",
      "past 2000-01-01 09:00",
      // Completed
      "daily 10:00 from 2099-01-01",
      "completed, due 2099-01-01 08:00",
      "completed, due 2000-01-02 09:00",
      "completed, due 2000-01-01 09:00"
    ]);
  });

  test("past reminders are ordered by their own date within the group", async () => {
    const db = await databaseTest();
    await db.reminders.add(once("2000-01-01 09:00", { title: "old" }));
    await db.reminders.add(once("2000-01-02 09:00", { title: "recent" }));
    expect(await sortedTitles(db, "asc")).toEqual(["old", "recent"]);
    expect(await sortedTitles(db, "desc")).toEqual(["recent", "old"]);
  });

  test("upcoming reminders are ordered by their own date within the group", async () => {
    const db = await databaseTest();
    await db.reminders.add(once("2099-01-02 09:00", { title: "later" }));
    await db.reminders.add(once("2099-01-01 09:00", { title: "soon" }));
    expect(await sortedTitles(db, "asc")).toEqual(["soon", "later"]);
    expect(await sortedTitles(db, "desc")).toEqual(["later", "soon"]);
  });

  test("completed reminders are ordered by their own date within the group", async () => {
    const db = await databaseTest();
    const completedAt = Date.now();
    await db.reminders.add(
      once("2099-01-01 09:00", { title: "later", completedAt })
    );
    await db.reminders.add(
      once("2000-01-01 09:00", { title: "earlier", completedAt })
    );
    expect(await sortedTitles(db, "asc")).toEqual(["earlier", "later"]);
    expect(await sortedTitles(db, "desc")).toEqual(["later", "earlier"]);
  });
});
