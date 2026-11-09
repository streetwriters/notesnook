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

type View = ArrayBufferView & { length: number; constructor: { name: string } };

const VIEWS: Record<string, new (data: number[]) => ArrayBufferView> = {
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
  Float32Array,
  Float64Array
};

export function encode(value: unknown) {
  return JSON.stringify(value, (_key, item) => {
    if (item instanceof ArrayBuffer)
      return { __ab: Array.from(new Uint8Array(item)) };
    if (ArrayBuffer.isView(item) && !(item instanceof DataView)) {
      const view = item as View;
      return { __view: view.constructor.name, data: Array.from(item as never) };
    }
    return item;
  });
}

export function decode<T>(text: string): T {
  return JSON.parse(text, (_key, item) => {
    if (!item || typeof item !== "object") return item;
    if (Array.isArray(item.__ab)) return new Uint8Array(item.__ab).buffer;
    if (Array.isArray(item.__u8)) return new Uint8Array(item.__u8);
    if (typeof item.__view === "string" && Array.isArray(item.data)) {
      const View = VIEWS[item.__view];
      if (View) return new View(item.data);
    }
    return item;
  });
}
