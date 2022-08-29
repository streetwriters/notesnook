import {
  initalize,
  logger as _logger,
  logManager
} from "@notesnook/core/logger";
import FileSaver from "file-saver";
import { DatabasePersistence, NNStorage } from "../interfaces/storage";
import { zip } from "./zip";

var logger: typeof _logger;
function initalizeLogger(persistence: DatabasePersistence = "db") {
  initalize(new NNStorage("Logs", persistence) as any);
  logger = _logger.scope("notesnook-web");
}

async function downloadLogs() {
  if (!logManager) return;
  const allLogs = await logManager.get();
  const files = allLogs.map((log) => ({
    filename: log.key,
    content: (log.logs as any[]).map((line) => JSON.stringify(line)).join("\n")
  }));
  const archive = await zip(files, "log");
  FileSaver.saveAs(new Blob([archive.buffer]), "notesnook-logs.zip");
}

async function clearLogs() {
  if (!logManager) return;

  await logManager.clear();
}

export { initalizeLogger, logger, downloadLogs, clearLogs };
