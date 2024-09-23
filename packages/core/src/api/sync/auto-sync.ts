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

import Database from "../index.js";
import { EVENTS } from "../../common.js";
import { DatabaseUpdatedEvent } from "../../database/index.js";
import { logger } from "../../logger.js";

export class AutoSync {
  timeout = 0;
  isAutoSyncing = false;
  logger = logger.scope("AutoSync");
  databaseUpdatedEvent?: { unsubscribe: () => boolean };

  constructor(
    private readonly db: Database,
    private readonly interval: number
  ) {}

  async start() {
    this.logger.info(`Auto sync requested`);
    if (this.isAutoSyncing) return;
    if (this.databaseUpdatedEvent) this.databaseUpdatedEvent.unsubscribe();

    this.isAutoSyncing = true;
    this.databaseUpdatedEvent = this.db.eventManager.subscribe(
      EVENTS.databaseUpdated,
      this.schedule.bind(this)
    );

    this.logger.info(`Auto sync started`);
  }

  stop() {
    this.isAutoSyncing = false;
    clearTimeout(this.timeout);
    if (this.databaseUpdatedEvent) this.databaseUpdatedEvent.unsubscribe();

    this.logger.info(`Auto sync stopped`);
  }

  private schedule(event: DatabaseUpdatedEvent) {
    if (
      event.collection === "notehistory" ||
      event.collection === "sessioncontent" ||
      ((event.type === "upsert" || event.type === "update") &&
        (event.item.remote ||
          ("localOnly" in event.item && event.item.localOnly) ||
          ("failed" in event.item && event.item.failed) ||
          ("dateUploaded" in event.item && event.item.dateUploaded)))
    )
      return;

    clearTimeout(this.timeout);
    // auto sync interval must not be 0 to avoid issues
    // during data collection which works based on Date.now().
    // It is required that the dateModified of an item should
    // be a few milliseconds less than Date.now(). Setting sync
    // interval to 0 causes a conflict where Date.now() & dateModified
    // are equal causing the item to not be synced.
    const interval =
      (event.type === "update" || event.type === "upsert") &&
      event.collection === "content"
        ? 100
        : this.interval;
    this.timeout = setTimeout(() => {
      this.logger.info(
        `Sync requested (type=${event.type} collection=${event.collection})`
      );
      this.db.eventManager.publish(EVENTS.databaseSyncRequested, false, false);
    }, interval) as unknown as number;
  }
}
