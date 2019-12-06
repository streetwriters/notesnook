import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/database";
import events from "events";

export const db = new Database(StorageInterface);
export const ev = new events.EventEmitter();

export function sendNewNoteEvent() {
  ev.emit("onNewNote");
}
