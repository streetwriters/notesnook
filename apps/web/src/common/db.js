import { EventSourcePolyfill as EventSource } from "event-source-polyfill";

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
  // db.host({
  //   API_HOST: "https://api.notesnook.com",
  //   AUTH_HOST: "https://auth.streetwriters.co",
  //   SSE_HOST: "https://events.streetwriters.co",
  // });
  // } else {
  // db.host({
  //   API_HOST: "http://localhost:5264",
  //   AUTH_HOST: "http://localhost:8264",
  //   SSE_HOST: "http://localhost:7264",
  // });
  const base = `http://${process.env.REACT_APP_LOCALHOST}`;
  db.host({
    API_HOST: `${base}:5264`,
    AUTH_HOST: `${base}:8264`,
    SSE_HOST: `${base}:7264`,
    ISSUES_HOST: `${base}:2624`,
    SUBSCRIPTIONS_HOST: `${base}:9264`,
  });
  // }

  await db.init();
  return db;
}

export { db, initializeDatabase };
