import React from "react";
import SelectionOptions from "./selectionoptions";
import { showToast } from "../utils/toast";
import download from "../utils/download";
import { Text } from "rebass";
import { showLoadingDialog } from "../common/dialog-controller";
import Config from "../utils/config";
import { store as userstore } from "../stores/user-store";
import { hashNavigate } from "../navigation";
import { db } from "./db";

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
  PREMIUM: 5,
  PREMIUM_EXPIRED: 6,
  PREMIUM_CANCELED: 7,
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
    onClick: () => hashNavigate("/notes/create", true),
  },
  notebooks: {
    title: "Create a notebook",
    onClick: () => hashNavigate("/notebooks/create"),
  },
  topics: {
    title: "Add a topic",
    onClick: () => hashNavigate(`/topics/create`),
  },
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
  if (process.env.REACT_APP_CI) return true;

  const subStatus = userstore.get().user?.subscription?.type;
  return (
    subStatus === SUBSCRIPTION_STATUS.BETA ||
    subStatus === SUBSCRIPTION_STATUS.PREMIUM ||
    subStatus === SUBSCRIPTION_STATUS.TRIAL
  );
}
