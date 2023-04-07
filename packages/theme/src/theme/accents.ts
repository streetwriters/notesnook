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

const accents = {
  orange: "#FF5722",
  yellow: "#FFA000",
  green: "#1B5E20",
  green2: "#008837",
  gray: "#757575",
  blue: "#0560ff",
  teal: "#009688",
  lightblue: "#2196F3",
  indigo: "#880E4F",
  purple: "#9C27B0",
  pink: "#FF1744",
  red: "#B71C1C"
} as const;

export function getDefaultAccentColor() {
  return accents.green2;
}

export function getAllAccents(): { label: Accents; code: string }[] {
  return Object.entries(accents).map(([key, value]) => {
    return { label: key as Accents, code: value };
  });
}

export type Accents = keyof typeof accents;
