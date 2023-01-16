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

const SINGLE_LINE_HEIGHT = 1.4;
const DEFAULT_FONT_SIZE = document.getElementById("p").clientHeight - 1;

const MAX_HEIGHTS = {
  note: SINGLE_LINE_HEIGHT * 7 * DEFAULT_FONT_SIZE,
  notebook: SINGLE_LINE_HEIGHT * 7 * DEFAULT_FONT_SIZE,
  generic: SINGLE_LINE_HEIGHT * 4 * DEFAULT_FONT_SIZE
};

function getNoteHeight(item) {
  const { notebooks, headline } = item;
  let height = SINGLE_LINE_HEIGHT * 3;
  //if (title.length > 35) height += SINGLE_LINE_HEIGHT;
  if (headline?.length > 0) height += SINGLE_LINE_HEIGHT * 2;
  else height += SINGLE_LINE_HEIGHT;
  if (notebooks?.length) height += SINGLE_LINE_HEIGHT;

  return height * DEFAULT_FONT_SIZE;
}

function getNotebookHeight(item) {
  const { topics, description, title } = item;
  // at the minimum we will have a title and the info text
  let height = SINGLE_LINE_HEIGHT * 3; // 2.8 = 2 lines

  if (title.length > 35) {
    height += SINGLE_LINE_HEIGHT; // title has become multiline
  }

  if (topics.length > 0) {
    height += SINGLE_LINE_HEIGHT;
  }

  if (description?.length > 0) {
    height += SINGLE_LINE_HEIGHT * 2;
  }

  return height * DEFAULT_FONT_SIZE;
}

function getItemHeight(item) {
  const { title } = item;
  // at the minimum we will have a title and the info text
  let height = SINGLE_LINE_HEIGHT * 3; // 2.8 = 2 lines

  if (title.length > 30) {
    height += SINGLE_LINE_HEIGHT; // title has become multiline
  }

  return height * DEFAULT_FONT_SIZE;
}

export { getNoteHeight, getNotebookHeight, getItemHeight, MAX_HEIGHTS };
