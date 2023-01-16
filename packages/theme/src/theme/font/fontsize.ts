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

export function getFontSizes(): FontSizes {
  return {
    heading: "1.5rem",
    subheading: "1.2rem",
    input: "0.875rem",
    title: "0.95rem",
    subtitle: "0.85rem",
    body: "0.8rem",
    menu: "0.8rem",
    subBody: "0.750rem",
    code: "0.9rem"
  };
}

export type FontSizes = {
  heading: string;
  subheading: string;
  input: string;
  title: string;
  subtitle: string;
  body: string;
  menu: string;
  subBody: string;
  code: string;
};
