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
    heading: "24px",
    subheading: "20px",
    input: "12px",
    title: "16px",
    subtitle: "14px",
    body: "12px",
    subBody: "10px",
    menu: "12px",
    code: "14px",
    xxs: "10px",
    xxs2: "11px",
    xs: "13px",
    sm: "15px",
    md: "17px",
    lg: "20px",
    xl: "25px",
    "2xl": "30px",
    "3xl": "35px",
    "4xl": "40px"
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
  xxxs: string;
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  "4xl": string;
};
