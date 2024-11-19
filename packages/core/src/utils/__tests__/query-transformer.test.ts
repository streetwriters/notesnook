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
import { transformQuery } from "../query-transformer.js";

function lt2(str: string) {
  return `(">${str}" OR ${str} OR "${str}<")`;
}

const TRANSFORM_QUERY_TESTS = [
  ["hello world", `hello AND world`],
  ["hello world OR bar", `hello AND world OR bar`],
  ["hello world OR bar NOT baz", `hello AND world OR bar NOT baz`],
  ["hello world OR NOT AND", `hello AND world`],
  ["hello world OR NOT AND something", `hello AND world AND something`],
  ["hello world -foo", `hello AND world AND "-foo"`],
  ["hello world phrase-with-dash", `hello AND world AND "phrase-with-dash"`],
  ["hello world phrase-with-dash*", 'hello AND world AND "phrase-with-dash*"'],
  [
    "example + foo + bar",
    `example AND ${lt2("+")} AND foo AND ${lt2("+")} AND bar`
  ],
  ["example OR foo NOT bar", `example OR foo NOT bar`],
  [
    'example "quoted phrase" "another quoted phrase"',
    `example AND "quoted phrase" AND "another quoted phrase"`
  ],
  ['"phrase-with-dash*"', `"phrase-with-dash*"`],
  [
    '-foo + bar OR "quoted-phrase"',
    `"-foo" AND ${lt2("+")} AND bar OR "quoted-phrase"`
  ],
  [
    'phrase-with-dash* + "quoted-phrase"',
    `"phrase-with-dash*" AND ${lt2("+")} AND "quoted-phrase"`
  ],
  [
    'example -foo + bar + "quoted-dash-phrase*" OR "another-quoted-phrase"',
    `example AND "-foo" AND ${lt2("+")} AND bar AND ${lt2(
      "+"
    )} AND "quoted-dash-phrase*" OR "another-quoted-phrase"`
  ],
  ["", ""],
  ["foo", `foo`],
  ['"quoted"', '"quoted"'],
  ["-foo -bar", `"-foo" AND "-bar"`],
  ["foo + + bar", `foo AND ${lt2("+")} AND ${lt2("+")} AND bar`],
  ["foo + OR", `foo AND ${lt2("+")}`],
  ['"special -phrase*"', '"special -phrase*"'],
  ["foo* + bar*", `"foo*" AND ${lt2("+")} AND "bar*"`],
  ["(foo + bar) -baz", `(foo AND ${lt2("+")} AND bar) AND "-baz"`],
  ['"phrase with "quotes""', '"phrase with ""quotes"""'],
  [
    'foo + "bar -baz" OR "qux*"',
    `foo AND ${lt2("+")} AND "bar -baz" OR "qux*"`
  ],
  ["foo + bar + ", `foo AND ${lt2("+")} AND bar AND ${lt2("+")}`],
  ["+foo bar", `+foo AND bar`],
  ["foo*bar*", `"foo*bar*"`],
  ['"escaped "quotes""', '"escaped ""quotes"""'],
  ["-hello-world", `"-hello-world"`],
  ["-hello-world*", '"-hello-world*"'],
  ["*helo*", `"*helo*"`],
  [">he", `">he"`],
  ["something<hello", `"something<hello"`],
  ["<", `"<"`],
  [">", `">"`]
];

for (const [input, expectedOutput] of TRANSFORM_QUERY_TESTS) {
  test(`should transform "${input}" into a valid SQL query`, () => {
    expect(transformQuery(input)).toBe(expectedOutput);
  });
}
