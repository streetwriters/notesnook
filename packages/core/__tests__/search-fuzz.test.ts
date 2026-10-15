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

import { databaseTest } from "./utils/index.js";
import { logger } from "../src/logger.js";
import { test, expect, vi } from "vitest";

const SEED = 0x6e6e;
const ITERATIONS = 1000;
const VOCABULARY = [
  // terms
  "ab",
  "x",
  "hello",
  "world",
  "foo*",
  "钢",
  "é",
  "a.b",
  "x:y",
  "^ab",
  "{x}",
  "-x",
  "*",
  "(",
  ")",
  "“smart”",
  "’",
  "–",
  "NEAR",
  "NEAR(",
  "hello\tworld",
  "a\nb",
  // operators
  "AND",
  "OR",
  "NOT",
  // quotes
  '"',
  '""',
  'a"b',
  '"foo',
  'foo"',
  '"x y"',
  // fields
  "title:",
  "content:"
];

// mulberry32
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("search should not fail for any query", () =>
  databaseTest().then(async (db) => {
    await db.notes.add({
      title: "hello world",
      content: { type: "tiptap", data: "<p>hello world ab x 钢</p>" }
    });
    const errors: string[] = [];
    const spy = vi
      .spyOn(logger, "error")
      .mockImplementation((_e, _message, context) => {
        errors.push((context as { query: string }).query);
      });

    const next = random(SEED);
    for (let i = 0; i < ITERATIONS; ++i) {
      const length = 1 + Math.floor(next() * 5);
      const query = Array.from(
        { length },
        () => VOCABULARY[Math.floor(next() * VOCABULARY.length)]
      ).join(" ");
      await db.lookup.notes(query).ids();
      await db.lookup.notesWithHighlighting(query, db.notes.all);
    }

    spy.mockRestore();
    expect(errors).toEqual([]);
  }));
