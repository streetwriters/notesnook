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

import { expect, test } from "vitest";
import { transformQuery } from "../query-transformer";

const TRANSFORM_QUERY_TESTS = [
  ["hello world", `"hello world"`],
  ["hello world OR bar", `"hello world" OR "bar"`],
  ["hello world OR bar NOT baz", `"hello world" OR "bar" NOT "baz"`],
  ["hello world OR NOT AND", `"hello world"`],
  ["hello world OR NOT AND something", `"hello world" AND "something"`],
  ["hello world -foo", `"hello world -foo"`],
  ["hello world phrase-with-dash", `"hello world phrase-with-dash"`],
  ["hello world phrase-with-dash*", '"hello world phrase-with-dash*"'],
  ["example + foo + bar", `"example + foo + bar"`],
  ["example OR foo NOT bar", `"example" OR "foo" NOT "bar"`],
  [
    'example "quoted phrase" "another quoted phrase"',
    `"example ""quoted phrase"" ""another quoted phrase"""`
  ],
  ['"phrase-with-dash*"', `""phrase-with-dash*""`],
  ['-foo + bar OR "quoted-phrase"', '"-foo + bar" OR ""quoted-phrase""'],
  [
    'phrase-with-dash* + "quoted-phrase"',
    '"phrase-with-dash* + ""quoted-phrase"""'
  ],
  [
    'example -foo + bar + "quoted-dash-phrase*" OR "another-quoted-phrase"',
    '"example -foo + bar + ""quoted-dash-phrase*""" OR ""another-quoted-phrase""'
  ],
  ["", ""],
  ["foo", `"foo"`],
  ['"quoted"', '""quoted""'],
  ["-foo -bar", `"-foo -bar"`],
  ["foo + + bar", `"foo + + bar"`],
  ["foo + OR", `"foo +"`],
  ['"special -phrase*"', '""special -phrase*""'],
  ["foo* + bar*", `"foo* + bar*"`],
  ["(foo + bar) -baz", `"(foo + bar) -baz"`],
  ['"phrase with "quotes""', '""phrase with ""quotes""""'],
  ['foo + "bar -baz" OR "qux*"', '"foo + ""bar -baz""" OR ""qux*""'],
  ["foo + bar + ", `"foo + bar +"`],
  ["+foo bar", `"+foo bar"`],
  ["foo*bar*", `"foo*bar*"`],
  ['"escaped "quotes""', '""escaped ""quotes""""'],
  ["-hello-world", `"-hello-world"`],
  ["-hello-world*", '"-hello-world*"'],
  ["*helo*", `"*helo*"`]
];

for (const [input, expectedOutput] of TRANSFORM_QUERY_TESTS) {
  test(`should transform "${input}" into a valid SQL query`, () => {
    expect(transformQuery(input)).toBe(expectedOutput);
  });
}
