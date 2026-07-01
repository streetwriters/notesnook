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
import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { config } from "../utils/config";
import { resolvePath } from "../utils/resolve-path";
import { app } from "electron";

const t = initTRPC.create();

const activeStreams = new Map<string, NodeJS.WritableStream>();

function generateId() {
  return Math.random().toString(36).slice(2);
}

function getStreamOrThrow(id: string, operation: "write" | "close") {
  const stream = activeStreams.get(id);
  if (!stream) {
    throw new Error(
      `Backup stream not found during ${operation}. The stream may have already been closed or was never opened. Stream id: ${id}`
    );
  }
  return stream;
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
      const id = generateId();
      activeStreams.set(id, stream);
      return id;
    }),

  write: t.procedure
    .input(z.object({ id: z.string(), chunk: z.string() }))
    .mutation(({ input }) => {
      const stream = getStreamOrThrow(input.id, "write");
      return new Promise<void>((resolve, reject) => {
        stream.write(Buffer.from(input.chunk, "base64"), (err) =>
          err ? reject(err) : resolve()
        );
      });
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
    })
});

app.on("before-quit", () => {
  try {
    for (const stream of activeStreams.values()) {
      stream.end();
    }
  } catch {
    // ignore
  }
});
