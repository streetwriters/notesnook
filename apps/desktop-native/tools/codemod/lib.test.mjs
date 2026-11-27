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
import { transform } from "./lib.mjs";

const run = (s) => transform(s, "a.tsx");

test("renames onPress, hover props and testID", () => {
  const { code } = run(
    `<Button onPress={go} onHoverIn={a} onHoverOut={b} testID="x" />`
  );
  expect(code).toBe(
    `<Button onClick={go} onMouseEnter={a} onMouseLeave={b} data-test-id="x" />`
  );
});

test("leaves an element that already has the new name", () => {
  const r = run(`<Box onPress={a} onClick={b} />`);
  expect(r.changed).toBe(false);
  expect(r.manual).toHaveLength(1);
});

test("onChangeText: inline handler destructures the event", () => {
  expect(run(`<Input onChangeText={(t: string) => set(t)} />`).code).toBe(
    `<Input onChange={({ target: { value: t } }) => set(t)} />`
  );
  expect(run(`<Input onChangeText={t => set(t)} />`).code).toBe(
    `<Input onChange={({ target: { value: t } }) => set(t)} />`
  );
});

test("onChangeText: other handlers are wrapped", () => {
  expect(run(`<Textarea onChangeText={setText} />`).code).toBe(
    `<Textarea onChange={(e) => (setText)(e.target.value)} />`
  );
});

test("onChangeText on a non-kit element is left", () => {
  expect(run(`<Custom onChangeText={f} />`).changed).toBe(false);
});

test("numberOfLines and resizeMode become sx", () => {
  expect(run(`<Text numberOfLines={2}>a</Text>`).code).toBe(
    `<Text sx={{ lineClamp: 2 }}>a</Text>`
  );
  expect(run(`<Image resizeMode="stretch" />`).code).toBe(
    `<Image sx={{ objectFit: "fill" }} />`
  );
});

test("numberOfLines merges into an existing sx", () => {
  expect(run(`<Text sx={{ color: "red" }} numberOfLines={1} />`).code).toBe(
    `<Text sx={{ lineClamp: 1, color: "red" }} />`
  );
  expect(run(`<Text sx={{}} numberOfLines={1} />`).code).toBe(
    `<Text sx={{ lineClamp: 1 }} />`
  );
});

test("unsupported values and non-literal sx are reported, not rewritten", () => {
  const a = run(`<Image resizeMode={mode} />`);
  expect(a.changed).toBe(false);
  expect(a.manual).toHaveLength(1);
  const b = run(`<Text sx={s} numberOfLines={1} />`);
  expect(b.changed).toBe(false);
  expect(b.manual).toHaveLength(1);
});

test("is idempotent", () => {
  const once = run(
    `<Input testID="i" onChangeText={(t) => f(t)} onPress={g} />`
  ).code;
  expect(run(once).changed).toBe(false);
});
