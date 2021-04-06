import StorageInterface from "../interfaces/storage";
import EventSource from "eventsource";
import Config from "../utils/config";
import http from "notes-core/utils/http";

/**
 * @type {import("notes-core/api").default}
 */
var db;
function initializeDatabase() {
  return import("notes-core/api").then(async ({ default: Database }) => {
    db = new Database(StorageInterface, EventSource);
    // db.host({
    //   API_HOST: "https://api.notesnook.com",
    //   AUTH_HOST: "https://auth.streetwriters.co",
    //   SSE_HOST: "https://events.streetwriters.co",
    // });

    db.host({
      API_HOST: "http://localhost:5264",
      AUTH_HOST: "http://localhost:8264",
      SSE_HOST: "http://localhost:7264",
    });

    await db.init();

    if (!isAppHydrated()) {
      setAppHydrated();
      loadDefaultNotes(db);
    }
  });
}

export { db, initializeDatabase };

function isAppHydrated() {
  return Config.get("hydrated", false);
}

function setAppHydrated() {
  return Config.set("hydrated", true);
}

async function loadDefaultNotes(db) {
  const notes = await http.get("/notes/index.json");
  if (!notes) return;
  let autoOpenId;
  for (let note of notes) {
    const content = await http.get(note.webContent);
    let id = await db.notes.add({
      title: note.title,
      headline: note.headline,
      localOnly: true,
      content: { type: "tiny", data: content },
    });
    if (note.autoOpen) autoOpenId = id;
  }

  if (autoOpenId) quickNavigate(`/notes/${autoOpenId}/edit`);
}

function quickNavigate(url) {
  window.history.replaceState(null, null, `#${url}`);
  dispatchEvent(new HashChangeEvent("hashchange"));
}
