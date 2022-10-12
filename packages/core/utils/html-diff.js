/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Parser } from "htmlparser2";

const ALLOWED_ATTRIBUTES = ["href", "src"];

export function isHTMLEqual(one, two) {
  if (typeof one !== "string" || typeof two !== "string") return false;

  return toDiffable(one) === toDiffable(two);
}

function toDiffable(html) {
  let text = "";
  const parser = new Parser({
    ontext: (data) => (text += data.trim()),
    onattribute: (name, value) => {
      if (ALLOWED_ATTRIBUTES.includes(name)) text += value.trim();
    }
  });
  parser.write(html);
  parser.end();
  return text;
}
