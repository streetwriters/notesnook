import { EventSourcePolyfill as EventSource } from "event-source-polyfill";
//const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
//global.EventSource =  NativeEventSource || EventSourcePolyfill;

global.HTMLParser = new DOMParser().parseFromString(
  "<body></body>",
  "text/html"
);
/**
 * @type {import("notes-core/api").default}
 */
var db;
async function initializeDatabase() {
  const { default: Database } = await import("notes-core/api");
  const { default: Storage } = await import("../interfaces/storage");
  const { default: FS } = await import("../interfaces/fs");
  db = new Database(Storage, EventSource, FS);

  // if (isTesting()) {
  //   db.host({
  //     API_HOST: "https://api.notesnook.com",
  //     AUTH_HOST: "https://auth.streetwriters.co",
  //     SSE_HOST: "https://events.streetwriters.co",
  //   });
  // } else {
  // db.host({
  //   API_HOST: "http://localhost:5264",
  //   AUTH_HOST: "http://localhost:8264",
  //   SSE_HOST: "http://localhost:7264",
  // });
  db.host({
    API_HOST: "http://192.168.10.29:5264",
    AUTH_HOST: "http://192.168.10.29:8264",
    SSE_HOST: "http://192.168.10.29:7264",
  });
  // }

  await db.init();
  return db;
}

export { db, initializeDatabase };
