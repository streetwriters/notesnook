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

import {
  initalize,
  logger as _logger,
  logManager
} from "@notesnook/core/dist/logger";
import { LogMessage } from "@notesnook/logger";
import FileSaver from "file-saver";
import { DatabasePersistence, NNStorage } from "../interfaces/storage";
import { zip } from "./zip";

let logger: typeof _logger;
async function initalizeLogger(persistence: DatabasePersistence = "db") {
  initalize(await NNStorage.createInstance("Logs", persistence));
  logger = _logger.scope("notesnook-web");
}

async function downloadLogs() {
  if (!logManager) return;
  const allLogs = await logManager.get();
  const files = allLogs.map((log) => ({
    filename: log.key,
    content: (log.logs as LogMessage[])
      .map((line) => JSON.stringify(line))
      .join("\n")
  }));
  const archive = await zip(files, "log");
  FileSaver.saveAs(new Blob([archive.buffer]), "notesnook-logs.zip");
}

async function clearLogs() {
  if (!logManager) return;

  await logManager.clear();
}

export { initalizeLogger, logger, downloadLogs, clearLogs };
