import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/";
import SelectionOptions from "./selectionoptions";

export const db = new Database(StorageInterface);

export const COLORS = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#FFD600",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E",
};

export const SELECTION_OPTIONS_MAP = {
  notes: SelectionOptions.NotesOptions,
  notebooks: SelectionOptions.NotebooksOptions,
  favorites: SelectionOptions.FavoritesOptions,
  trash: SelectionOptions.TrashOptions,
  topics: SelectionOptions.TopicOptions,
};

export const DEFAULT_CONTEXT = { colors: [], tags: [], notebook: {} };
