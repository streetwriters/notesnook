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

export function findItemAndDelete<T>(
  array: T[],
  predicate: (item: T) => boolean
) {
  return deleteAtIndex(array, array.findIndex(predicate));
}

export function addItem<T>(array: T[], item: T) {
  const index = array.indexOf(item);
  if (index > -1) return false;
  array.push(item);
  return true;
}

export function deleteItem<T>(array: T[], item: T) {
  return deleteAtIndex(array, array.indexOf(item));
}

export function deleteItems<T>(array: T[], ...items: T[]) {
  for (const item of items) {
    deleteItem(array, item);
  }
  return array;
}

export function findById<T extends { id: string }>(array: T[], id: string) {
  if (!array) return false;
  return array.find((item) => item.id === id);
}

export function hasItem<T>(array: T[], item: T) {
  if (!array) return false;
  return array.indexOf(item) > -1;
}

function deleteAtIndex<T>(array: T[], index: number) {
  if (index === -1) return false;
  array.splice(index, 1);
  return true;
}

export function toChunks<T>(array: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}

export function* chunkedIterate<T>(array: T[], chunkSize: number) {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    yield chunk;
  }
}

export async function* chunkify<T>(
  iterator: AsyncIterableIterator<T> | IterableIterator<T>,
  chunkSize: number
) {
  let chunk: T[] = [];
  for await (const item of iterator) {
    chunk.push(item);
    if (chunk.length === chunkSize) {
      yield chunk;
      chunk = [];
    }
  }
  if (chunk.length > 0) {
    yield chunk;
  }
}
