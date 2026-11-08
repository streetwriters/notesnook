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

import { initialize, logger as _logger, logManager } from "@notesnook/core";
import { LogMessage, NoopLogger, format } from "@notesnook/logger";
import { ZipFile } from "./streams/zip-stream";
import { sanitizeFilename } from "@notesnook/common";
import { databaseHost, environment, files } from "@platform";

let logger: typeof _logger = new NoopLogger();
async function initializeLogger() {
  await initialize(
    {
      dialect: (name) =>
        databaseHost.createDialect({
          name,
          encrypted: false
        }),
      journalMode: databaseHost.journalMode,
      lockingMode: databaseHost.lockingMode,
      tempStore: "memory",
      synchronous: "normal",
      pageSize: 8192,
      cacheSize: -32000,
      skipInitialization: false
    },
    false
  );
  logger = _logger.scope(`notesnook-${environment.platform}`);
}

async function downloadLogs() {
  if (!logManager) return;
  const { createZipStream } = await import("./streams/zip-stream");
  const allLogs = await logManager.get();
  let i = 0;
  const textEncoder = new TextEncoder();
  const file = await files.create("notesnook-logs.zip");
  await new ReadableStream<ZipFile>({
    pull(controller) {
      const log = allLogs[i++];
      if (!log) {
        controller.close();
        return;
      }
      controller.enqueue({
        path: sanitizeFilename(log.key, { replacement: "-" }) + ".log",
        data: textEncoder.encode(
          (log.logs as LogMessage[]).map((line) => format(line)).join("\n")
        )
      });
    }
  })
    .pipeThrough(createZipStream())
    .pipeTo(
      new WritableStream<Uint8Array>({
        write: (chunk) => file.write(chunk),
        close: () => file.close(),
        abort: () => file.abort()
      })
    );
}

async function clearLogs() {
  if (!logManager) return;

  await logManager.clear();
}

export { initializeLogger, logger, downloadLogs, clearLogs };
