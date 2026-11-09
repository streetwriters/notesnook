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

import { describe, expect, test } from "vitest";
import { decode, encode } from "./kv-codec";

describe("kv codec", () => {
  test("an ArrayBuffer round trips as an ArrayBuffer", () => {
    const source = new Uint8Array([1, 2, 3, 250]).buffer;
    const value = decode<ArrayBuffer>(encode(source));
    expect(value).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(value))).toEqual([1, 2, 3, 250]);
  });

  test("a Uint8Array round trips as a Uint8Array", () => {
    const value = decode<Uint8Array>(encode(new Uint8Array([9, 8, 7])));
    expect(value).toBeInstanceOf(Uint8Array);
    expect(Array.from(value)).toEqual([9, 8, 7]);
  });

  test("other typed arrays keep their type", () => {
    const value = decode<Uint32Array>(encode(new Uint32Array([70000, 5])));
    expect(value).toBeInstanceOf(Uint32Array);
    expect(Array.from(value)).toEqual([70000, 5]);
  });

  test("buffers nested in objects and arrays survive", () => {
    const source = {
      credentials: [{ id: "password", salt: new Uint8Array([1, 2]) }],
      wrapped: new Uint8Array([4, 5, 6]).buffer,
      name: "x",
      n: 3
    };
    const value = decode<typeof source>(encode(source));
    expect(value.credentials[0].salt).toBeInstanceOf(Uint8Array);
    expect(value.wrapped).toBeInstanceOf(ArrayBuffer);
    expect(value.name).toBe("x");
    expect(value.n).toBe(3);
  });

  test("plain values are unchanged", () => {
    expect(decode(encode({ a: [1, "b", null, true] }))).toEqual({
      a: [1, "b", null, true]
    });
  });
});
