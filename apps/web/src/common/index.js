import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/";
import events from "events";

export const db = new Database(StorageInterface);
export const ev = new events.EventEmitter();

export const COLORS = [
  { label: "red", code: "#ed2d37" },
  { label: "orange", code: "#ec6e05" },
  { label: "yellow", code: "yellow" },
  { label: "green", code: "green" },
  { label: "blue", code: "blue" },
  { label: "purple", code: "purple" },
  { label: "gray", code: "gray" }
];

export const DEFAULT_CONTEXT = { colors: [], tags: [], notebook: {} };
