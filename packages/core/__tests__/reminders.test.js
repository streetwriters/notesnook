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

import { formatReminderTime } from "../src/collections/reminders";
import MockDate from "mockdate";
import { describe, afterAll, beforeAll, test, expect } from "vitest";

describe("format reminder time", () => {
  afterAll(() => {
    MockDate.reset();
  });

  beforeAll(() => {
    MockDate.set(new Date(2022, 5, 6, 5, 5));
  });

  test("daily reminder [today]", () => {
    const reminder = {
      recurringMode: "day",
      date: new Date(0).setHours(14),
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 02:00 PM");
  });

  test("daily reminder [tomorrow]", () => {
    const reminder = {
      recurringMode: "day",
      date: new Date(0).setHours(3),
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 03:00 AM");
  });

  test("weekly reminder [current week]", () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(8),
      selectedDays: [3, 5],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Wed, 08-06-2022 08:00 AM"
    );
  });

  test("weekly reminder [next week]", () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(3),
      selectedDays: [0],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Sun, 12-06-2022 03:00 AM"
    );
  });

  test("weekly reminder [current week, multiple days]", () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(8),
      selectedDays: [0, 5, 6],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Fri, 10-06-2022 08:00 AM"
    );
  });

  test("weekly reminder [current week, today]", () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(21),
      selectedDays: [0, 1],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test("weekly reminder [current week, today with multiple days]", () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(5).setHours(21),
      selectedDays: [1, 2, 5, 6],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test("monthly reminder [current month]", () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(8),
      selectedDays: [12, 18],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Sun, 12-06-2022 08:00 AM"
    );
  });

  test("monthly reminder [next month]", () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(3),
      selectedDays: [1, 2, 3],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Fri, 01-07-2022 03:00 AM"
    );
  });

  test("monthly reminder [current month, today]", () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(21),
      selectedDays: [6],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test("monthly reminder [current month, today with multiple days]", () => {
    const reminder = {
      recurringMode: "month",
      date: new Date(0).setHours(21),
      selectedDays: [6, 7, 8],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 09:00 PM");
  });

  test("today", () => {
    const reminder = {
      date: new Date(2022, 5, 6, 8, 5).getTime(),
      mode: "once"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Today, 08:05 AM");
  });

  test("tomorrow", () => {
    const reminder = {
      date: new Date(2022, 5, 7, 8, 5).getTime(),
      mode: "once"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 08:05 AM");
  });

  test("yesterday", () => {
    const reminder = {
      date: new Date(2022, 5, 5, 8, 5).getTime(),
      mode: "once"
    };
    expect(formatReminderTime(reminder)).toBe("Last: Yesterday, 08:05 AM");
  });

  test("exactly on time", () => {
    const reminder = {
      date: new Date(2022, 5, 6, 5, 5).getTime(),
      mode: "once"
    };
    expect(formatReminderTime(reminder)).toBe("Last: Today, 05:05 AM");
  });

  test("past but still on the same day", () => {
    const reminder = {
      date: new Date(2022, 5, 6, 3, 5).getTime(),
      mode: "once"
    };
    expect(formatReminderTime(reminder)).toBe("Last: Today, 03:05 AM");
  });

  test("the exact current time tomorrow", () => {
    const reminder = {
      date: new Date(2022, 5, 6, 5, 5).getTime(),
      mode: "repeat",
      recurringMode: "day"
    };
    expect(formatReminderTime(reminder)).toBe("Upcoming: Tomorrow, 05:05 AM");
  });

  test("same day next week because time has passed today", () => {
    const reminder = {
      recurringMode: "week",
      date: new Date(0).setHours(3),
      selectedDays: [1],
      mode: "repeat"
    };
    expect(formatReminderTime(reminder)).toBe(
      "Upcoming: Mon, 13-06-2022 03:00 AM"
    );
  });
});
