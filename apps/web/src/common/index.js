import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/";
import SelectionOptions from "./selectionoptions";
import EventSource from "eventsource";
import { navigate } from "hookrouter";
import { store as editorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { showAddNotebookDialog } from "../components/dialogs/addnotebookdialog";
import { showTopicDialog } from "../components/dialogs/topicdialog";

export const db = new Database(StorageInterface, EventSource);
db.host("http://localhost:4100");

export const COLORS = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#FFD600",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E",
};

export const SUBSCRIPTION_STATUS = {
  EXPIRED: 0,
  TRIAL: 1,
  ACTIVE: 2,
  ACTIVE_RENEWING: 3,
  CANCELLED: 4,
};

export const SELECTION_OPTIONS_MAP = {
  notes: SelectionOptions.NotesOptions,
  notebooks: SelectionOptions.NotebooksOptions,
  favorites: SelectionOptions.FavoritesOptions,
  trash: SelectionOptions.TrashOptions,
  topics: SelectionOptions.TopicOptions,
};

export const CREATE_BUTTON_MAP = {
  notes: {
    title: "Make a note",
    onClick: () => editorStore.newSession(noteStore.get().context),
  },
  notebooks: { title: "Create a notebook", onClick: showAddNotebookDialog },
  topics: { title: "Add a topic", onClick: showTopicDialog },
};

export const DEFAULT_CONTEXT = { colors: [], tags: [], notebook: {} };

export function notesFromContext(context) {
  let notes = [];
  switch (context.type) {
    case "tag":
      notes = db.notes.tagged(context.value);
      break;
    case "color":
      notes = db.notes.colored(context.value);
      if (!notes.length) return navigate("/");
      break;
    case "topic":
      const notebook = db.notebooks.notebook(context.value.id);
      const topic = notebook.topics.topic(context.value.topic);
      notes = topic.all;
      break;
    case "favorites":
      notes = db.notes.favorites;
      break;
    default:
      return [];
  }
  return notes;
}
