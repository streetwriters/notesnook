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
  }

  async start() {
    if (!(await checkIsUserPremium(CHECK_IDS.databaseSync))) return;

    this.databaseUpdatedEvent = this.db.eventManager.subscribeSingle(
      EVENTS.databaseUpdated,
      this.schedule.bind(this)
    );
  }

  stop() {
    clearTimeout(this.timeout);
    if (this.databaseUpdatedEvent) this.databaseUpdatedEvent.unsubscribe();
  }

  /**
   * @private
   */
  schedule() {
    this.stop();
    this.timeout = setTimeout(() => {
      this.db.eventManager.publish(EVENTS.databaseSyncRequested, false, false);
    }, this.interval);
  }
}
