import { EventSourcePolyfill as EventSource } from "event-source-polyfill";
import { NNStorage } from "../interfaces/storage";
import { logger } from "../utils/logger";

/**
 * @type {import("@streetwriters/notesnook-core/api").default}
 */
var db;
async function initializeDatabase(persistence) {
  logger.measure("Database initialization");

  const { default: Database } = await import(
    "@streetwriters/notesnook-core/api"
  );
  const { default: FS } = await import("../interfaces/fs");
  db = new Database(new NNStorage("Notesnook", persistence), EventSource, FS);

  // if (isTesting()) {
  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co"
  });
  // } else {
  // db.host({
  //   API_HOST: "http://localhost:5264",
  //   AUTH_HOST: "http://localhost:8264",
  //   SSE_HOST: "http://localhost:7264",
  // });
  // const base = `http://${process.env.REACT_APP_LOCALHOST}`;
  // db.host({
  //   API_HOST: `${base}:5264`,
  //   AUTH_HOST: `${base}:8264`,
  //   SSE_HOST: `${base}:7264`,
  //   ISSUES_HOST: `${base}:2624`,
  //   SUBSCRIPTIONS_HOST: `${base}:9264`,
  // });
  // }

  // db.eventManager.subscribe(EVENTS.databaseMigrating, async ({ from, to }) => {

  // });

  await db.init();

  logger.measure("Database initialization");

  if (db.migrations.required()) {
    const { showMigrationDialog } = await import("./dialog-controller");
    await showMigrationDialog();
  }
  return db;
}

export { db, initializeDatabase };
