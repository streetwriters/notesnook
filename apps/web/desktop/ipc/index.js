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

import { ipcMain } from "electron";
import { logger } from "../logger";
import { getAction } from "./actions";
import { getCall } from "./calls";

ipcMain.on("fromRenderer", async (event, args) => {
  logger.info("Action requested by renderer", args);

  const { type } = args;
  const action = getAction(type);
  if (!action) return;
  await action(args);
});

ipcMain.handle("fromRenderer", async (event, args) => {
  const { type } = args;
  logger.info("Call requested by renderer", type);
  const call = getCall(type);
  if (!call) return;

  return await call(args, global.win);
});
