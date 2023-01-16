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

import { EVENTS } from "../../common";
import { logger } from "../../logger";

export class AutoSync {
  /**
   *
   * @param {import("../index").default} db
   * @param {number} interval
   */
  constructor(db, interval) {
    this.db = db;
    this.interval = interval;
    this.timeout = null;
    this.isAutoSyncing = false;
    this.logger = logger.scope("AutoSync");
  }

  async start() {
    this.logger.info(`Auto sync requested`);
    if (this.isAutoSyncing) return;

    this.isAutoSyncing = true;
    this.databaseUpdatedEvent = this.db.eventManager.subscribeSingle(
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

  /**
   * @private
   */
  schedule(id, item) {
    if (item && (item.remote || item.localOnly || item.failed)) return;

    clearTimeout(this.timeout);
    // auto sync interval must not be 0 to avoid issues
    // during data collection which works based on Date.now().
    // It is required that the dateModified of an item should
    // be a few milliseconds less than Date.now(). Setting sync
    // interval to 0 causes a conflict where Date.now() & dateModified
    // are equal causing the item to not be synced.
    const interval = item && item.type === "tiptap" ? 100 : this.interval;
    this.timeout = setTimeout(() => {
      this.logger.info(`Sync requested by: ${id}`);
      this.db.eventManager.publish(EVENTS.databaseSyncRequested, false, false);
    }, interval);
  }
}
