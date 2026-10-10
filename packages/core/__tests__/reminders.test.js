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

// Parses "12 Feb 2026 11:21PM" as local time.
function at(str) {
  const [, d, mon, y, h, m, p] = str.match(
    /^(\d+) (\w{3}) (\d{4}) (\d+):(\d+)\s?(AM|PM)$/
  );
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ].indexOf(mon);
  const hour = (Number(h) % 12) + (p === "PM" ? 12 : 0);
  return new Date(Number(y), month, Number(d), hour, Number(m)).getTime();
}

describe("getUpcomingReminderTime", () => {
  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(() => {
    MockDate.set(at("6 Jun 2022 5:05AM"));
  });

  function repeat(recurringMode, date, selectedDays) {
    return {
      mode: "repeat",
      title: "Random reminder",
      recurringMode,
      date: at(date),
      selectedDays
    };
  }

  test("once reminder returns its date", () => {
    const date = at("1 Jun 2022 10:00AM");
    expect(getUpcomingReminderTime({ mode: "once", title: "r", date })).toBe(
      date
    );
  });

  test("daily reminder later today", () => {
    expect(getUpcomingReminderTime(repeat("day", "1 Jan 2022 2:00PM"))).toBe(
      at("6 Jun 2022 2:00PM")
    );
  });

  test("daily reminder already passed today", () => {
    expect(getUpcomingReminderTime(repeat("day", "1 Jan 2022 3:00AM"))).toBe(
      at("7 Jun 2022 3:00AM")
    );
  });

  test("daily reminder starting in the future returns the start date", () => {
    expect(getUpcomingReminderTime(repeat("day", "9 Jun 2022 12:00PM"))).toBe(
      at("9 Jun 2022 12:00PM")
    );
  });

  test("daily reminder starting right now moves to the next day", () => {
    expect(getUpcomingReminderTime(repeat("day", "6 Jun 2022 5:05AM"))).toBe(
      at("7 Jun 2022 5:05AM")
    );
  });

  test("daily reminder starting later today returns the start date", () => {
    expect(getUpcomingReminderTime(repeat("day", "6 Jun 2022 12:00PM"))).toBe(
      at("6 Jun 2022 12:00PM")
    );
  });

  test("daily reminder with explicit `from` returns the next occurrence", () => {
    const reminder = repeat("day", "9 Jun 2022 12:00PM");
    expect(getUpcomingReminderTime(reminder, at("10 Jun 2022 12:00PM"))).toBe(
      at("11 Jun 2022 12:00PM")
    );
  });

  test("weekly reminder picks the next selected day", () => {
    expect(
      getUpcomingReminderTime(repeat("week", "1 Jan 2022 8:00AM", [3, 5]))
    ).toBe(at("8 Jun 2022 8:00AM"));
  });

  test("weekly reminder wraps to the next week", () => {
    expect(
      getUpcomingReminderTime(repeat("week", "1 Jan 2022 8:00AM", [0]))
    ).toBe(at("12 Jun 2022 8:00AM"));
  });

  test("weekly reminder starting in the future on a selected day", () => {
    // 15 Jun 2022 is a Wednesday
    expect(
      getUpcomingReminderTime(repeat("week", "15 Jun 2022 8:00AM", [3, 5]))
    ).toBe(at("15 Jun 2022 8:00AM"));
  });

  test("weekly reminder starting in the future on a non-selected day", () => {
    // starts on a Wednesday; only Friday is selected
    expect(
      getUpcomingReminderTime(repeat("week", "15 Jun 2022 8:00AM", [5]))
    ).toBe(at("17 Jun 2022 8:00AM"));
  });

  test("monthly reminder picks the next selected date", () => {
    expect(
      getUpcomingReminderTime(repeat("month", "1 Jan 2022 9:00AM", [10, 20]))
    ).toBe(at("10 Jun 2022 9:00AM"));
  });

  test("monthly reminder wraps to next month", () => {
    expect(
      getUpcomingReminderTime(repeat("month", "1 Jan 2022 9:00AM", [2]))
    ).toBe(at("2 Jul 2022 9:00AM"));
  });

  test("monthly reminder starting in the future", () => {
    expect(
      getUpcomingReminderTime(repeat("month", "10 Aug 2022 9:00AM", [15]))
    ).toBe(at("15 Aug 2022 9:00AM"));
  });

  test("yearly reminder later this year", () => {
    expect(getUpcomingReminderTime(repeat("year", "25 Dec 2020 9:00AM"))).toBe(
      at("25 Dec 2022 9:00AM")
    );
  });

  test("yearly reminder already passed this year", () => {
    expect(getUpcomingReminderTime(repeat("year", "10 Mar 2020 9:00AM"))).toBe(
      at("10 Mar 2023 9:00AM")
    );
  });

  test("yearly reminder starting in the future returns the start date", () => {
    expect(getUpcomingReminderTime(repeat("year", "20 Mar 2023 5:05AM"))).toBe(
      at("20 Mar 2023 5:05AM")
    );
  });
});

describe("reminder groups", () => {
  beforeEach(() => MockDate.set(new Date(2022, 5, 6, 5, 5, 0, 0)));
  afterAll(() => MockDate.reset());

  const base = { title: "Reminder", mode: "once" };
  const GROUPS = ["Upcoming", "Past", "Completed"];

  test("group is derived from trigger time and completedAt", () => {
    const future = new Date(2022, 5, 7).getTime();
    const past = new Date(2022, 5, 5).getTime();
    expect(getReminderGroup({ ...base, date: future })).toBe("Upcoming");
    expect(getReminderGroup({ ...base, date: past })).toBe("Past");
    expect(getReminderGroup({ ...base, date: past, disabled: true })).toBe(
      "Past"
    );
    expect(getReminderGroup({ ...base, date: past, snoozeUntil: future })).toBe(
      "Upcoming"
    );
    expect(getReminderGroup({ ...base, date: past, completedAt: 1 })).toBe(
      "Completed"
    );
    expect(getReminderGroup({ ...base, date: future, completedAt: 1 })).toBe(
      "Completed"
    );
    expect(
      getReminderGroup({
        ...base,
        mode: "repeat",
        recurringMode: "day",
        date: past
      })
    ).toBe("Upcoming");
  });

  test("SQL group matches JS group", async () => {
    const db = await databaseTest();
    const cases = [
      { date: new Date(2022, 5, 7).getTime() },
      { date: new Date(2022, 5, 5).getTime() },
      { date: new Date(2022, 5, 5).getTime(), disabled: true },
      {
        date: new Date(2022, 5, 5).getTime(),
        snoozeUntil: new Date(2022, 5, 7).getTime()
      },
      { date: new Date(2022, 5, 5).getTime(), completedAt: 1 },
      { date: new Date(2022, 5, 7).getTime(), completedAt: 1 },
      {
        date: new Date(2022, 5, 5).getTime(),
        mode: "repeat",
        recurringMode: "day"
      }
    ];
    for (const c of cases) {
      const reminder = { ...base, ...c };
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

  test("grouped list returns Upcoming, Past, Completed in order", async () => {
    MockDate.reset();
    const db = await databaseTest();
    await db.reminders.add({
      ...base,
      title: "c",
      date: Date.now() + 1e7,
      completedAt: 1
    });
    await db.reminders.add({ ...base, title: "p", date: Date.now() - 1e7 });
    await db.reminders.add({ ...base, title: "u", date: Date.now() + 1e7 });
    const groups = await db.reminders.all.groups({
      groupBy: "default",
      sortBy: "dueDate",
      sortDirection: "asc"
    });
    expect(groups.map((g) => g.group.title)).toEqual(GROUPS);
  });
});

describe("getUpcomingReminder", () => {
  beforeEach(() => MockDate.set(new Date("6 Jun 2022 5:05 AM")));
  afterAll(() => MockDate.reset());

  const at = (str) => new Date(str).getTime();
  const once = (title, date) => ({ title, mode: "once", date: at(date) });
  const repeat = (title, recurringMode, date, selectedDays) => ({
    title,
    mode: "repeat",
    recurringMode,
    date: at(date),
    selectedDays
  });

  test("empty list returns undefined", () => {
    expect(getUpcomingReminder([])).toBeUndefined();
  });

  test("single reminder is returned as is", () => {
    const r = once("a", "7 Jun 2022 9:00 AM");
    expect(getUpcomingReminder([r])).toBe(r);
  });

  test("returns the earliest of several once reminders", () => {
    const a = once("a", "9 Jun 2022 9:00 AM");
    const b = once("b", "7 Jun 2022 9:00 AM");
    const c = once("c", "8 Jun 2022 9:00 AM");
    expect(getUpcomingReminder([a, b, c])).toBe(b);
  });

  test("repeating reminder is ranked by its next occurrence, not its stored date", () => {
    // stored date is in January, but next occurrence is 6 Jun 2:00 PM
    const daily = repeat("daily", "day", "1 Jan 2022 2:00 PM");
    const later = once("later", "7 Jun 2022 9:00 AM");
    expect(getUpcomingReminder([later, daily])).toBe(daily);
  });

  test("once reminder wins over a repeating reminder with a later occurrence", () => {
    const daily = repeat("daily", "day", "1 Jan 2022 2:00 PM");
    const sooner = once("sooner", "6 Jun 2022 10:00 AM");
    expect(getUpcomingReminder([daily, sooner])).toBe(sooner);
  });

  test("repeating reminders compare by next occurrence", () => {
    const evening = repeat("evening", "day", "1 Jan 2022 9:00 PM");
    const morning = repeat("morning", "day", "1 Jan 2022 3:00 AM"); // tomorrow
    const noon = repeat("noon", "day", "1 Jan 2022 12:00 PM");
    expect(getUpcomingReminder([morning, evening, noon])).toBe(noon);
  });

  test("weekly and monthly reminders use their next selected occurrence", () => {
    const weekly = repeat("weekly", "week", "1 Jan 2022 8:00 AM", [3]); // 8 Jun
    const monthly = repeat("monthly", "month", "1 Jan 2022 8:00 AM", [7]); // 7 Jun
    expect(getUpcomingReminder([weekly, monthly])).toBe(monthly);
  });

  test("repeating reminder starting in the future uses its start date", () => {
    const future = repeat("future", "day", "20 Jun 2022 12:00 PM");
    const near = once("near", "10 Jun 2022 9:00 AM");
    expect(getUpcomingReminder([future, near])).toBe(near);
  });

  test("the earlier of two ties keeps its position", () => {
    const a = once("a", "7 Jun 2022 9:00 AM");
    const b = once("b", "7 Jun 2022 9:00 AM");
    expect(getUpcomingReminder([a, b])).toBe(a);
  });

  test("a past once reminder is never the upcoming one", () => {
    const past = once("past", "1 Jun 2022 9:00 AM");
    const next = once("next", "7 Jun 2022 9:00 AM");
    expect(getUpcomingReminder([next, past])).toBe(next);
  });

  test("returns undefined when only past once reminders exist", () => {
    const past = once("past", "1 Jun 2022 9:00 AM");
    const now = once("now", "6 Jun 2022 5:05 AM");
    expect(getUpcomingReminder([past, now])).toBeUndefined();
  });

  test("a past once reminder does not hide repeating reminders", () => {
    const past = once("past", "1 Jun 2022 9:00 AM");
    const daily = repeat("daily", "day", "1 Jan 2022 2:00 PM");
    expect(getUpcomingReminder([past, daily])).toBe(daily);
  });
});

describe("markComplete", () => {
  const NOW = new Date("6 Jun 2022 5:05 AM").getTime();

  beforeEach(() => MockDate.set(NOW));
  afterAll(() => MockDate.reset());

  async function allReminders(db) {
    return db
      .sql()
      .selectFrom("reminders")
      .select(["id", "mode", "title", "date", "completedAt", "snoozeUntil"])
      .execute();
  }

  async function completeRepeating(fields) {
    const db = await databaseTest();
    const id = await db.reminders.add({
      title: "Repeating",
      mode: "repeat",
      ...fields,
      date: at(fields.date)
    });
    await db.reminders.markComplete(id);
    const rows = await allReminders(db);
    return {
      db,
      id,
      original: rows.find((r) => r.id === id),
      duplicates: rows.filter((r) => r.id !== id)
    };
  }

  test("once reminder is marked completed in place", async () => {
    const db = await databaseTest();
    const date = at("7 Jun 2022 9:00 AM");
    const id = await db.reminders.add({ title: "Once", mode: "once", date });
    await db.reminders.markComplete(id);

    const rows = await allReminders(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].completedAt).toBe(NOW);
    expect(rows[0].date).toBe(date);
  });

  test("permanent reminder is left untouched", async () => {
    const db = await databaseTest();
    const date = at("1 Jan 2022 9:00 AM");
    const id = await db.reminders.add({
      title: "Ongoing",
      mode: "permanent",
      date
    });
    await db.reminders.markComplete(id);

    const rows = await allReminders(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].completedAt).toBeFalsy();
    expect(rows[0].date).toBe(date);
  });

  test("daily reminder advances and leaves a completed once duplicate", async () => {
    const { original, duplicates } = await completeRepeating({
      recurringMode: "day",
      date: "6 Jun 2022 3:00 AM"
    });

    expect(original.mode).toBe("repeat");
    expect(original.completedAt).toBeFalsy();
    expect(original.date).toBe(at("8 Jun 2022 3:00 AM"));

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toMatchObject({
      mode: "once",
      title: "Repeating",
      date: at("6 Jun 2022 3:00 AM"),
      completedAt: NOW
    });
    expect(duplicates[0].snoozeUntil).toBeFalsy();
  });

  test("duplicate drops the snooze while the original keeps it", async () => {
    const snoozeUntil = at("6 Jun 2022 6:00 AM");
    const { original, duplicates } = await completeRepeating({
      recurringMode: "day",
      date: "6 Jun 2022 8:00 AM",
      snoozeUntil
    });

    expect(original.snoozeUntil).toBe(snoozeUntil);
    expect(duplicates[0].snoozeUntil).toBeFalsy();
  });

  test("daily reminder starting in the future advances by one day", async () => {
    const { original } = await completeRepeating({
      recurringMode: "day",
      date: "9 Jun 2022 12:00 PM"
    });
    expect(original.date).toBe(at("10 Jun 2022 12:00 PM"));
  });

  test("weekly reminder advances to the following selected day", async () => {
    const { original } = await completeRepeating({
      recurringMode: "week",
      date: "1 Jan 2022 8:00 AM",
      selectedDays: [3, 5]
    });
    expect(original.date).toBe(at("10 Jun 2022 8:00 AM"));
  });

  test("monthly reminder advances to the following selected date", async () => {
    const { original } = await completeRepeating({
      recurringMode: "month",
      date: "1 Jan 2022 9:00 AM",
      selectedDays: [10, 20]
    });
    expect(original.date).toBe(at("20 Jun 2022 9:00 AM"));
  });

  test("yearly reminder advances by a year", async () => {
    const { original } = await completeRepeating({
      recurringMode: "year",
      date: "10 Mar 2020 9:00 AM"
    });
    expect(original.date).toBe(at("10 Mar 2024 9:00 AM"));
  });

  test("completing a repeating reminder twice creates two duplicates", async () => {
    const { db, id, duplicates } = await completeRepeating({
      recurringMode: "day",
      date: "1 Jan 2022 3:00 AM"
    });
    expect(duplicates).toHaveLength(1);

    await db.reminders.markComplete(id);
    const rows = await allReminders(db);
    expect(rows.filter((r) => r.id !== id)).toHaveLength(2);
    expect(rows.find((r) => r.id === id).date).toBe(at("9 Jun 2022 3:00 AM"));
  });
});

describe("sorting reminders by due date", () => {
  beforeEach(() => MockDate.reset());

  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  const NAMES = {
    completedIn1h: "completed reminder which will trigger in 1h",
    completed2hAgo: "completed reminder which triggered 2h ago",
    completed3dAgo: "completed reminder which triggered 3d ago",
    past1hAgo: "past reminder which triggered 1h ago",
    past4hAgo: "past reminder which triggered 4h ago",
    past2dAgo: "past reminder which triggered 2d ago",
    onceIn3h: "one-time reminder which will trigger in 3h",
    onceIn1h: "one-time reminder which will trigger in 1h",
    dailyIn2h: "daily reminder which will next trigger in 2h",
    dailyFrom5d: "daily reminder which will start in 5d"
  };

  let dailyIn2hId;

  async function setup() {
    const db = await databaseTest();
    const now = Date.now();
    const add = (title, fields) =>
      db.reminders.add({ title, mode: "once", ...fields });

    await add(NAMES.completedIn1h, { date: now + HOUR, completedAt: now });
    await add(NAMES.completed2hAgo, {
      date: now - 2 * HOUR,
      completedAt: now
    });
    await add(NAMES.completed3dAgo, {
      date: now - 3 * DAY,
      completedAt: now
    });
    await add(NAMES.past1hAgo, { date: now - HOUR });
    await add(NAMES.past4hAgo, { date: now - 4 * HOUR });
    await add(NAMES.past2dAgo, { date: now - 2 * DAY });
    await add(NAMES.onceIn3h, { date: now + 3 * HOUR });
    await add(NAMES.onceIn1h, { date: now + HOUR });
    // started yesterday, next occurrence is in 2h
    dailyIn2hId = await add(NAMES.dailyIn2h, {
      mode: "repeat",
      recurringMode: "day",
      date: now + 2 * HOUR - DAY
    });
    // starts in 5 days, so that is its first occurrence
    await add(NAMES.dailyFrom5d, {
      mode: "repeat",
      recurringMode: "day",
      date: now + 5 * DAY
    });
    return db;
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
    const db = await setup();
    expect(await sortedTitles(db, "asc")).toEqual([
      NAMES.onceIn1h,
      NAMES.dailyIn2h,
      NAMES.onceIn3h,
      NAMES.dailyFrom5d,
      NAMES.past2dAgo,
      NAMES.past4hAgo,
      NAMES.past1hAgo,
      NAMES.completed3dAgo,
      NAMES.completed2hAgo,
      NAMES.completedIn1h
    ]);
  });

  test("latest first", async () => {
    const db = await setup();
    expect(await sortedTitles(db, "desc")).toEqual([
      NAMES.dailyFrom5d,
      NAMES.onceIn3h,
      NAMES.dailyIn2h,
      NAMES.onceIn1h,
      NAMES.past1hAgo,
      NAMES.past4hAgo,
      NAMES.past2dAgo,
      NAMES.completedIn1h,
      NAMES.completed2hAgo,
      NAMES.completed3dAgo
    ]);
  });

  test("completing a daily reminder moves it behind another upcoming reminder", async () => {
    const db = await setup();
    await db.reminders.markComplete(dailyIn2hId);

    /*
     * next occurrence is now tomorrow, after "once in 3h"; the completed
     * duplicate keeps the old date and joins the Completed group
     * */
    expect(await sortedTitles(db, "asc")).toEqual([
      NAMES.onceIn1h,
      NAMES.onceIn3h,
      NAMES.dailyIn2h,
      NAMES.dailyFrom5d,
      NAMES.past2dAgo,
      NAMES.past4hAgo,
      NAMES.past1hAgo,
      NAMES.completed3dAgo,
      NAMES.dailyIn2h,
      NAMES.completed2hAgo,
      NAMES.completedIn1h
    ]);
    expect(await sortedTitles(db, "desc")).toEqual([
      NAMES.dailyFrom5d,
      NAMES.dailyIn2h,
      NAMES.onceIn3h,
      NAMES.onceIn1h,
      NAMES.past1hAgo,
      NAMES.past4hAgo,
      NAMES.past2dAgo,
      NAMES.completedIn1h,
      NAMES.completed2hAgo,
      NAMES.dailyIn2h,
      NAMES.completed3dAgo
    ]);
  });

  test("past reminders are ordered by their own date within the group", async () => {
    const db = await databaseTest();
    const now = Date.now();
    await db.reminders.add({
      title: "old",
      mode: "once",
      date: now - 3 * HOUR
    });
    await db.reminders.add({
      title: "recent",
      mode: "once",
      date: now - HOUR
    });
    expect(await sortedTitles(db, "asc")).toEqual(["old", "recent"]);
    expect(await sortedTitles(db, "desc")).toEqual(["recent", "old"]);
  });

  test("upcoming reminders are ordered by their own date within the group", async () => {
    const db = await databaseTest();
    const now = Date.now();
    await db.reminders.add({
      title: "later",
      mode: "once",
      date: now + 3 * HOUR
    });
    await db.reminders.add({
      title: "soon",
      mode: "once",
      date: now + HOUR
    });
    expect(await sortedTitles(db, "asc")).toEqual(["soon", "later"]);
    expect(await sortedTitles(db, "desc")).toEqual(["later", "soon"]);
  });

  test("completed reminders are ordered by their own date within the group", async () => {
    const db = await databaseTest();
    const now = Date.now();
    await db.reminders.add({
      title: "later",
      mode: "once",
      date: now + HOUR,
      completedAt: now
    });
    await db.reminders.add({
      title: "earlier",
      mode: "once",
      date: now - 3 * HOUR,
      completedAt: now
    });
    expect(await sortedTitles(db, "asc")).toEqual(["earlier", "later"]);
    expect(await sortedTitles(db, "desc")).toEqual(["later", "earlier"]);
  });
});
