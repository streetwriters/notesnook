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

function info(context: string, ...logs: unknown[]) {}

function error(context: string, ...logs: unknown[]) {
  console.log(
    `${new Date().toLocaleDateString()}::error::${context}: `,
    ...logs
  );
}

type Logger = {
  info: (context: string, ...logs: unknown[]) => void;
  error: (context: string, ...logs: unknown[]) => void;
};

declare global {
  // eslint-disable-next-line no-var
  var logger: Logger;
}

global.logger = {
  info,
  error
};

export {};
