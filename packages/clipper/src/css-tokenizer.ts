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

const from = String.fromCharCode;

function trim(value: string): string {
  return value.trim();
}

function charat(value: string, index: number): number {
  return value.charCodeAt(index) | 0;
}

function strlen(value: string): number {
  return value.length;
}

function substr(value: string, begin: number, end: number): string {
  return value.slice(begin, end);
}

function append<T>(value: T, array: T[]): T {
  array.push(value);
  return value;
}

let line = 1;
let column = 1;
let length = 0;
let position = 0;
let character = 0;
let characters = "";

function next(): number {
  character = position < length ? charat(characters, position++) : 0;

  if ((column++, character === 10)) (column = 1), line++;

  return character;
}

function peek(): number {
  return charat(characters, position);
}

function slice(begin: number, end: number): string {
  return substr(characters, begin, end);
}

function token(type: number): number {
  switch (type) {
    // \0 \t \n \r \s whitespace token
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;

    // ! + , / > @ ~ isolate token
    case 33:
    case 42:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    case 59: /* ; { } breakpoint token */
    case 123:
    case 125:
      return 4;
    // : accompanied token
    case 58:
      return 3;
    // " ' ( [ opening delimit token
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    // ) ] closing delimit token
    case 41:
    case 93:
      return 1;
  }

  return 0;
}

function alloc(value: string): [] {
  line = column = 1;
  length = strlen((characters = value));
  position = 0;
  return [];
}

function dealloc<T>(value: T): T {
  characters = "";
  return value;
}

function delimit(type: number): string {
  return trim(
    slice(
      position - 1,
      delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)
    )
  );
}

export function tokenize(value: string): string[] {
  return dealloc(tokenizer(alloc(value)));
}

function tokenizer(children: string[]): string[] {
  while (next())
    switch (token(character)) {
      case 0:
        append(identifier(position - 1), children);
        break;
      case 2:
        append(delimit(character), children);
        break;
      default:
        append(from(character), children);
    }

  return children;
}

function delimiter(type: number): number {
  while (next())
    switch (character) {
      // ] ) " '
      case type:
        return position;
      // " '
      case 34:
      case 39:
        if (type !== 34 && type !== 39) delimiter(character);
        break;
      // (
      case 40:
        if (type === 41) delimiter(type);
        break;
      // \
      case 92:
        next();
        break;
    }

  return position;
}

function identifier(index: number): string {
  while (!token(peek())) next();

  return slice(index, position);
}
