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

type TitleCase<T extends string, D extends string = " "> = string extends T
  ? never
  : T extends `${infer F}${D}${infer R}`
  ? `${Capitalize<F>}${D}${TitleCase<R, D>}`
  : Capitalize<T>;

type Separator = " " | "-" | "_";

type CamelCase<T extends string> = T extends `${Separator}${infer Suffix}`
  ? CamelCase<Suffix>
  : T extends `${infer Prefix}${Separator}`
  ? CamelCase<Prefix>
  : T extends `${infer Prefix}${Separator}${infer Suffix}`
  ? CamelCase<`${Prefix}${Capitalize<Suffix>}`>
  : T;

type KebabCaseHelper<
  S,
  Acc extends string = ""
> = S extends `${infer C}${infer T}`
  ? KebabCaseHelper<
      T extends Uncapitalize<T> ? T : Uncapitalize<T>,
      `${Acc}${Lowercase<C>}${T extends Uncapitalize<T> ? "" : "-"}`
    >
  : Acc;
export type KebabCase<S extends string> = KebabCaseHelper<S>;

export function toTitleCase<T extends string>(str: T): TitleCase<T> | "" {
  if (!str || !str[0]) {
    return "";
  }
  return (str[0].toUpperCase() + str.substring(1)) as TitleCase<T>;
}

export function toCamelCase<T extends string>(str: T): CamelCase<T> {
  return str.replaceAll(/-(.{1})/gm, (_str, letter) => {
    return letter.toUpperCase();
  }) as CamelCase<T>;
}

export function countWords(str: string): number {
  str = str.trim();
  if (!str.length) return 0;
  return str.split(/\W+\S/).length;
}

export function pluralize(
  count: number,
  singular: string,
  plural: string
): string {
  return !count || count > 1 ? `${count} ${plural}` : `${count} ${singular}`;
}
