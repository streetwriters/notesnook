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

import { Database, EVENTS } from "@notesnook/core";

export function startSync(db: Database): void {
  // Respond to auto-sync check: always enable both autoSync and sync
  db.eventManager.subscribe(EVENTS.syncCheckStatus, async (type: string) => ({
    type,
    result: true
  }));

  // When the database requests a sync, honour it immediately
  db.eventManager.subscribe(
    EVENTS.databaseSyncRequested,
    async (full: boolean, force: boolean) => {
      try {
        await db.sync({ type: full ? "full" : "send", force });
      } catch (err) {
        process.stderr.write(`Sync error: ${err}\n`);
      }
    }
  );

  // Kick off an initial full sync
  db.sync({ type: "full" })
    .then(() => process.stderr.write("Initial sync complete.\n"))
    .catch((err: unknown) =>
      process.stderr.write(`Initial sync failed: ${err}\n`)
    );

  // Open the SSE channel for real-time push
  db.connectSSE().catch((err) =>
    process.stderr.write(`SSE connect failed: ${err}\n`)
  );

  process.stderr.write("Sync wired up.\n");
}
