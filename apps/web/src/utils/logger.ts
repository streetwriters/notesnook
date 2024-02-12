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
import { DatabasePersistence, NNStorage } from "../interfaces/storage";
import { ZipFile, createZipStream } from "./streams/zip-stream";
import { createWriteStream } from "./stream-saver";
import { sanitizeFilename } from "@notesnook/common";

let logger: typeof _logger;
async function initalizeLogger(persistence: DatabasePersistence = "db") {
  initalize(await NNStorage.createInstance("Logs", persistence), false);
  logger = _logger.scope("notesnook-web");
}

async function downloadLogs() {
  if (!logManager) return;
  const allLogs = await logManager.get();
  let i = 0;
  const textEncoder = new TextEncoder();
  await new ReadableStream<ZipFile>({
    pull(controller) {
      const log = allLogs[i++];
      if (!log) {
        controller.close();
        return;
      }
      controller.enqueue({
        path: sanitizeFilename(log.key, { replacement: "-" }),
        data: textEncoder.encode(
          (log.logs as LogMessage[])
            .map((line) => JSON.stringify(line))
            .join("\n")
        )
      });
    }
  })
    .pipeThrough(createZipStream())
    .pipeTo(await createWriteStream("notesnook-logs.zip"));
}

async function clearLogs() {
  if (!logManager) return;

  await logManager.clear();
}

export { initalizeLogger, logger, downloadLogs, clearLogs };
