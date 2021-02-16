import StorageInterface from "../interfaces/storage";
import EventSource from "eventsource";

/**
 * @type {import("notes-core/api").default}
 */
var db;
function initializeDatabase() {
  return import("notes-core/api").then(({ default: Database }) => {
    db = new Database(StorageInterface, EventSource);
    return db.init();
  });
}

export { db, initializeDatabase };

// export const db = new Database(StorageInterface, EventSource);

// // db.host({
// //   API_HOST: "https://api.notesnook.com",
// //   AUTH_HOST: "https://auth.streetwriters.co",
// //   SSE_HOST: "https://events.streetwriters.co",
// // });

// db.host({
//   API_HOST: "http://localhost:5264",
//   AUTH_HOST: "http://localhost:8264",
//   SSE_HOST: "http://localhost:7264",
// });

// // db.host({
// //   API_HOST: "http://192.168.10.7:5264",
// //   AUTH_HOST: "http://192.168.10.7:8264",
// //   SSE_HOST: "http://192.168.10.7:7264",
// // });
