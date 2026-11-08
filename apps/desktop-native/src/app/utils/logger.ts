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
import { createWriteStream } from "./stream-saver";
import { sanitizeFilename } from "@notesnook/common";
import { createDialect } from "../common/sqlite";
import { isFeatureSupported } from "./feature-check";

let logger: typeof _logger = new NoopLogger();
async function initializeLogger() {
  const multiTab = !!globalThis.SharedWorker && isFeatureSupported("opfs");
  await initialize(
    {
      dialect: (name, init) =>
        createDialect({
          name,
          init,
          async: !isFeatureSupported("opfs"),
          multiTab,
          encrypted: false
        }),
      ...(IS_DESKTOP_APP || isFeatureSupported("opfs")
        ? { journalMode: "WAL", lockingMode: "exclusive" }
        : {
            journalMode: "MEMORY",
            lockingMode: "exclusive"
          }),
      tempStore: "memory",
      synchronous: "normal",
      pageSize: 8192,
      cacheSize: -32000,
      skipInitialization: !IS_DESKTOP_APP && multiTab
    },
    false
  );
  logger = _logger.scope("notesnook-web");
}

async function downloadLogs() {
  if (!logManager) return;
  const { createZipStream } = await import("./streams/zip-stream");
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
        path: sanitizeFilename(log.key, { replacement: "-" }) + ".log",
        data: textEncoder.encode(
          (log.logs as LogMessage[]).map((line) => format(line)).join("\n")
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

export { initializeLogger, logger, downloadLogs, clearLogs };
