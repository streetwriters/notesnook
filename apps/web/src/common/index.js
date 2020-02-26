import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/";
import events from "events";

export const db = new Database(StorageInterface);
export const ev = new events.EventEmitter();

export const COLORS = {
  red: "#ed2d37",
  orange: "#ec6e05",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  purple: "purple",
  gray: "gray"
};

export const DEFAULT_CONTEXT = { colors: [], tags: [], notebook: {} };
