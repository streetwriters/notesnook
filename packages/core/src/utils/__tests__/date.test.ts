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

import { test, expect, describe } from "vitest";
import { formatDate } from "../date.js";

describe("formatDate", () => {
  describe("with valid input", () => {
    const FIXED_EPOCH = 1700000000000; // 2023-11-14T22:13:20.000Z

    test("formats a numeric epoch as date-time", () => {
      expect(
        formatDate(FIXED_EPOCH, {
          type: "date-time",
          dateFormat: "DD-MM-YYYY",
          timeFormat: "24-hour"
        })
      ).toMatch(/\d{2}-\d{2}-\d{4} \d{2}:\d{2}/);
    });

    test("formats a Date instance as date", () => {
      expect(
        formatDate(new Date(FIXED_EPOCH), {
          type: "date",
          dateFormat: "YYYY-MM-DD"
        })
      ).toBe("2023-11-14");
    });

    test("formats an ISO string as time", () => {
      const result = formatDate("2023-11-14T22:13:20.000Z", {
        type: "time",
        timeFormat: "24-hour"
      });
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("with invalid input", () => {
    test("returns empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });

    test("returns empty string for undefined", () => {
      expect(formatDate(undefined)).toBe("");
    });

    test("returns empty string for an unparseable string", () => {
      expect(formatDate("not-a-real-date")).toBe("");
    });

    test("returns empty string regardless of options.type", () => {
      expect(
        formatDate(null, {
          type: "date",
          dateFormat: "DD-MM-YYYY"
        })
      ).toBe("");
      expect(
        formatDate(null, {
          type: "time",
          timeFormat: "12-hour"
        })
      ).toBe("");
      expect(formatDate(null, { type: "timezone" })).toBe("");
    });

    test("does NOT leak the literal string 'Invalid Date'", () => {
      // This is the regression we're fixing. Before this PR, formatDate(null)
      // returned "Invalid Date" (or "Invalid Date Invalid Date" depending on
      // the date-time format). Once this string lands in an exported markdown
      // frontmatter / HTML <meta> tag / reminder dropdown, there is no signal
      // anything went wrong.
      expect(formatDate(null)).not.toContain("Invalid");
      expect(formatDate(undefined)).not.toContain("Invalid");
      expect(formatDate("garbage")).not.toContain("Invalid");
    });
  });
});
