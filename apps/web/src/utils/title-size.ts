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

import { TitleSize } from "../stores/setting-store";

export function titleSizeToVariant(size: TitleSize | undefined): string {
  switch (size) {
    case "small":
      return "body";
    case "medium":
      return "subtitle";
    case "large":
      return "title";
    default:
      return "body";
  }
}
export function titleSizeToTextAreaFontSize(
  size: TitleSize | undefined
): string[] {
  switch (size) {
    case "small":
      return ["1.25em", "1.25em", "1.875em"];
    case "medium":
      return ["1.625em", "1.625em", "2.625em"];
    case "large":
      return ["2em", "2em", "3.125em"];
    default:
      return ["1.625em", "1.625em", "2.625em"];
  }
}
