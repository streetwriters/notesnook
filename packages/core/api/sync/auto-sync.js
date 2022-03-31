import { checkIsUserPremium, CHECK_IDS, EVENTS } from "../../common";

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
  }

  async start() {
    if (!(await checkIsUserPremium(CHECK_IDS.databaseSync))) return;
    if (this.isAutoSyncing) return;

    this.isAutoSyncing = true;
    this.databaseUpdatedEvent = this.db.eventManager.subscribeSingle(
      EVENTS.databaseUpdated,
      this.schedule.bind(this)
    );
  }

  stop() {
    this.isAutoSyncing = false;
    clearTimeout(this.timeout);
    if (this.databaseUpdatedEvent) this.databaseUpdatedEvent.unsubscribe();
  }

  /**
   * @private
   */
  schedule(id, item) {
    if (item && (item.remote || item.localOnly || item.failed)) return;

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      console.log("SYNC REQUESTED by", id);
      this.db.eventManager.publish(EVENTS.databaseSyncRequested, false, false);
    }, this.interval);
  }
}
