import React from "react";
import StorageInterface from "../interfaces/storage";
import Database from "notes-core/api/";
import SelectionOptions from "./selectionoptions";
import EventSource from "eventsource";
import { showTopicDialog } from "../components/dialogs/topicdialog";
import { showToast } from "../utils/toast";
import download from "../utils/download";
import { Text } from "rebass";
import { showLoadingDialog } from "../components/dialogs/loadingdialog";
import Config from "../utils/config";
import { store as userstore } from "../stores/user-store";
import { hashNavigate } from "../navigation";

export const db = new Database(StorageInterface, EventSource);

db.host({
  API_HOST: "https://api.notesnook.com",
  AUTH_HOST: "https://auth.streetwriters.co",
  SSE_HOST: "https://events.streetwriters.co",
});

// db.host({
//   API_HOST: "http://localhost:5264",
//   AUTH_HOST: "http://localhost:8264",
//   SSE_HOST: "http://localhost:7264",
// });

// db.host({
//   API_HOST: "http://192.168.10.8:5264",
//   AUTH_HOST: "http://192.168.10.8:8264",
//   SSE_HOST: "http://192.168.10.8:7264",
// });

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
  BASIC: 0,
  TRIAL: 1,
  BETA: 2,
  TRIAL_EXPIRED: 3,
  BETA_EXPIRED: 4,
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
    onClick: () => hashNavigate("/notes/create"),
  },
  notebooks: {
    title: "Create a notebook",
    onClick: () => hashNavigate("/notebooks/create"),
  },
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

export async function createBackup() {
  const encryptBackups = Config.get("encryptBackups", false);
  const data = await showLoadingDialog({
    title: "Creating backup",
    subtitle: "We are creating a backup of your data. Please wait...",
    action: async () => {
      return await db.backup.export("web", encryptBackups);
    },
    message: (
      <Text color="error">
        Please do NOT close your browser or shut down your PC.
      </Text>
    ),
  });
  download(
    `notesnook-backup-${new Date().toLocaleString("en")}`,
    data,
    "nnbackup"
  );
  await showToast("success", "Backup created!");
}

export function isUserPremium() {
  const subStatus = userstore.get().user?.subscription?.status;
  return subStatus && subStatus >= 1 && subStatus <= 3;
}
