import React from "react";
import SelectionOptions from "./selectionoptions";
import { showToast } from "../utils/toast";
import download from "../utils/download";
import { Text } from "rebass";
import {
  showFeatureDialog,
  showLoadingDialog,
  showPasswordDialog,
} from "../common/dialog-controller";
import Config from "../utils/config";
import { hashNavigate, getCurrentHash } from "../navigation";
import { db } from "./db";
import { sanitizeFilename } from "../utils/filename";
import { isTesting } from "../utils/platform";

export const COLORS = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Gray",
];

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
    onClick: () =>
      hashNavigate("/notes/create", { addNonce: true, replace: true }),
  },
  notebooks: {
    title: "Create a notebook",
    onClick: () => hashNavigate("/notebooks/create"),
  },
  topics: {
    title: "Create a topic",
    onClick: () => hashNavigate(`/topics/create`),
  },
  tags: {
    title: "Create a tag",
    onClick: () => hashNavigate(`/tags/create`),
  },
};

export async function introduceFeatures() {
  const hash = getCurrentHash().replace("#", "");
  if (!!hash || isTesting()) return;
  const features = ["monographs"];
  for (let feature of features) {
    if (!Config.get(`feature:${feature}`)) {
      await showFeatureDialog(feature);
    }
  }
}

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
      const notebook = db.notebooks.notebook(context?.value?.id);
      if (!notebook) break;
      const topic = notebook.topics?.topic(context?.value?.topic);
      if (!topic) break;
      notes = topic.all;
      break;
    case "favorite":
      notes = db.notes.favorites;
      break;
    default:
      return [];
  }
  return notes;
}

export async function createBackup(save = true) {
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
  const filename = sanitizeFilename(
    `notesnook-backup-${new Date().toLocaleString("en")}`
  );
  const ext = "nnbackup";
  showToast("success", "Backup created!");

  if (!save) return { data, filename, ext };
  else download(filename, data, ext);
}

export function getTotalNotes(notebook) {
  return notebook.topics.reduce((sum, topic) => {
    return sum + topic.notes.length;
  }, 0);
}

export async function verifyAccount() {
  if (!(await db.user.getUser())) return true;
  return showPasswordDialog("verify_account", ({ password }) => {
    return db.user.verifyPassword(password);
  });
}
