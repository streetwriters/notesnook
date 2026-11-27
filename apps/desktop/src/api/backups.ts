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

import { initTRPC } from "@trpc/server";
import { createWriteStream, mkdirSync, type WriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { config } from "../utils/config";
import { resolvePath } from "../utils/resolve-path";
import { app } from "electron";

const t = initTRPC.create();

const activeStreams = new Map<string, { stream: WriteStream; path: string }>();

function generateId() {
  return Math.random().toString(36).slice(2);
}

function getStreamOrThrow(id: string, operation: "write" | "close") {
  const entry = activeStreams.get(id);
  if (!entry) {
    throw new Error(
      `Backup stream not found during ${operation}. The stream may have already been closed or was never opened. Stream id: ${id}`
    );
  }
  return entry.stream;
}

async function discard(id: string) {
  const entry = activeStreams.get(id);
  if (!entry) return;
  activeStreams.delete(id);
  await new Promise<void>((resolve) => {
    if (entry.stream.closed) return resolve();
    entry.stream.once("close", () => resolve());
    entry.stream.destroy();
  });
  await rm(entry.path, { force: true });
}

export const backupsRouter = t.router({
  open: t.procedure
    .input(z.object({ filename: z.string() }))
    .mutation(({ input }) => {
      const { filename } = input;
      if (!filename.trim()) {
        throw new Error("Invalid backup filename: filename cannot be empty.");
      }
      if (filename.includes(path.sep) || filename.includes("\\"))
        throw new Error(
          `Invalid backup filename: expected a plain file name without path separators, received "${filename}".`
        );
      const resolvedBackupDir = resolvePath(config.backupDirectory);
      const backupPath = path.resolve(resolvedBackupDir, filename);
      const relativeBackupPath = path.relative(resolvedBackupDir, backupPath);
      if (
        relativeBackupPath.startsWith("..") ||
        path.isAbsolute(relativeBackupPath)
      )
        throw new Error(
          `Invalid backup filename: resolved path "${backupPath}" is outside the configured backup directory "${resolvedBackupDir}". The configured backup directory may be invalid.`
        );

      mkdirSync(resolvedBackupDir, { recursive: true });
      const stream = createWriteStream(backupPath, { encoding: "utf-8" });
      // A failed write also emits "error"; without a listener that would be
      // an uncaught exception. The write mutation handles cleanup.
      stream.on("error", (e) => console.error("Backup stream error", e));
      const id = generateId();
      activeStreams.set(id, { stream, path: backupPath });
      return id;
    }),

  write: t.procedure
    .input(z.object({ id: z.string(), chunk: z.string() }))
    .mutation(async ({ input }) => {
      const stream = getStreamOrThrow(input.id, "write");
      try {
        await new Promise<void>((resolve, reject) => {
          stream.write(Buffer.from(input.chunk, "base64"), (err) =>
            err ? reject(err) : resolve()
          );
        });
      } catch (e) {
        await discard(input.id);
        throw e;
      }
    }),

  close: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const stream = getStreamOrThrow(input.id, "close");
      return new Promise<void>((resolve) => {
        stream.end(() => {
          activeStreams.delete(input.id);
          resolve();
        });
      });
    }),

  abort: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => discard(input.id))
});

app.on("before-quit", () => {
  try {
    for (const { stream } of activeStreams.values()) {
      stream.end();
    }
  } catch {
    // ignore
  }
});
