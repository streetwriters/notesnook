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

import { ILogReporter, LogLevel, LogMessage } from "../types.js";

export const consoleReporter: ILogReporter = {
  write: (log) => {
    switch (log.level) {
      case LogLevel.Fatal:
        console.error(format(log));
        // TODO
        break;
      case LogLevel.Error:
        console.error(format(log));
        break;
      case LogLevel.Warn:
        console.warn(format(log));
        break;
      case LogLevel.Info:
        console.info(format(log));
        break;
      case LogLevel.Debug:
        console.debug(format(log));
        break;
      case LogLevel.Log:
        console.log(format(log));
        break;
    }
  }
};

type Token = {
  value?: string;
  separator?: " | " | " > " | ": ";
};
export function format(log: LogMessage) {
  const time = new Date(log.timestamp).toISOString();
  const tokens: Token[] = [
    { value: time, separator: " | " },
    { value: LogLevel[log.level].toUpperCase(), separator: " | " },
    { value: log.scope ? `[${log.scope}]` : "", separator: ": " },
    { value: log.message }
  ];

  if (log.extras) tokens.push({ value: JSON.stringify(log.extras) });

  tokens.push({ value: `[${log.elapsed}ms]` });

  let line = "";
  for (const token of tokens) {
    if (token.value) {
      line += token.value;
      if (token.separator) line += token.separator;
      else line += " ";
    }
  }
  return line;
}
