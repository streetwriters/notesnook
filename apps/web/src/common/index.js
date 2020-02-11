import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/";
import events from "events";

export const db = new Database(StorageInterface);
export const ev = new events.EventEmitter();
console.log("from common", db);
export function sendNewNoteEvent() {
  ev.emit("onNewNote");
}
