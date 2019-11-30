import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/database";

export const db = new Database(StorageInterface);
