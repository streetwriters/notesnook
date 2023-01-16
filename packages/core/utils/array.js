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

export function findItemAndDelete(array, predicate) {
  return deleteAtIndex(array, array.findIndex(predicate));
}

export function addItem(array, item) {
  const index = array.indexOf(item);
  if (index > -1) return false;
  array.push(item);
  return true;
}

export function deleteItem(array, item) {
  return deleteAtIndex(array, array.indexOf(item));
}

export function deleteItems(array, ...items) {
  for (let item of items) {
    deleteItem(array, item);
  }
}

export function findById(array, id) {
  if (!array) return false;
  return array.find((item) => item.id === id);
}

export function hasItem(array, item) {
  if (!array) return false;
  return array.indexOf(item) > -1;
}

function deleteAtIndex(array, index) {
  if (index === -1) return false;
  array.splice(index, 1);
  return true;
}

export function toChunks(array, chunkSize) {
  let chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}
