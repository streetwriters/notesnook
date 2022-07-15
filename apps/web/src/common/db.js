import { EventSourcePolyfill as EventSource } from "event-source-polyfill";
import { EVENTS } from "notes-core/common";
import { TaskManager } from "./task-manager";

/**
 * @type {import("notes-core/api").default}
 */
var db;
async function initializeDatabase(persistence) {
  const { default: Database } = await import("notes-core/api");
  const { NNStorage } = await import("../interfaces/storage");
  const { default: FS } = await import("../interfaces/fs");
  db = new Database(new NNStorage(persistence), EventSource, FS);

  // if (isTesting()) {
  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co",
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

  db.eventManager.subscribe(EVENTS.databaseMigrating, async ({ from, to }) => {
    await TaskManager.startTask({
      type: "modal",
      title: `Migrating your database`,
      subtitle:
        "Please do not close your browser/app before the migration is done.",
      action: (task) => {
        task({ text: `Migrating database from v${from} to v${to}` });
        return new Promise((resolve) => {
          db.eventManager.subscribe(EVENTS.databaseMigrated, resolve);
        });
      },
    });
  });

  await db.init();
  return db;
}

export { db, initializeDatabase };
