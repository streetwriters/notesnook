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

import type { LaunchRequest } from "../../../platform";

export type ParsedLaunch = { hidden: boolean; request?: LaunchRequest };

function option(args: string[], name: string) {
  const prefix = `--${name}=`;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(prefix)) return args[i].slice(prefix.length);
    if (args[i] === `--${name}`) return args[i + 1];
  }
  return undefined;
}

export function parseLaunchArgs(args: string[]): ParsedLaunch {
  const hidden = args.includes("--hidden");
  const words = args.filter((arg) => !arg.startsWith("-"));
  const [command, subject] = words;
  if (command === "new") {
    if (subject === "note" || subject === "notebook" || subject === "reminder")
      return { hidden, request: { type: "create", item: subject } };
  } else if (command === "open") {
    const id = option(args, "id");
    if ((subject === "note" || subject === "notebook") && id)
      return { hidden, request: { type: "open", item: subject, id } };
  }
  return { hidden };
}
