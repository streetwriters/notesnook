import {
  showFeatureDialog,
  showLoadingDialog,
  showPasswordDialog,
  showReminderDialog,
} from "../common/dialog-controller";
import Config from "../utils/config";
import { hashNavigate, getCurrentHash } from "../navigation";
import { db } from "./db";
import { sanitizeFilename } from "../utils/filename";
import { isTesting } from "../utils/platform";
import { store as userstore } from "../stores/user-store";
import FileSaver from "file-saver";
import { showToast } from "../utils/toast";
import { SUBSCRIPTION_STATUS } from "./constants";

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
  const features = [];
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
  });
  if (!data) {
    showToast("error", "Could not create a backup of your data.");
    return;
  }

  const filename = sanitizeFilename(
    `notesnook-backup-${new Date().toLocaleString("en")}`
  );

  const ext = "nnbackup";
  if (!save) {
    return { data, filename, ext };
  } else {
    FileSaver.saveAs(new Blob([Buffer.from(data)]), `${filename}.${ext}`);
  }
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

export function totalSubscriptionConsumed(user) {
  if (!user) return 0;
  const start = user.subscription?.start;
  const end = user.subscription?.expiry;
  if (!start || !end) return 0;

  const total = end - start;
  const consumed = Date.now() - start;

  return Math.round((consumed / total) * 100);
}

export async function showUpgradeReminderDialogs() {
  if (isTesting()) return;

  const user = userstore.get().user;
  if (!user) return;

  const consumed = totalSubscriptionConsumed(user);
  const isTrial = user?.subscription?.type === SUBSCRIPTION_STATUS.TRIAL;
  const isBasic = user?.subscription?.type === SUBSCRIPTION_STATUS.BASIC;
  if (isBasic && consumed >= 100) {
    await showReminderDialog("trialexpired");
  } else if (isTrial && consumed >= 75) {
    await showReminderDialog("trialexpiring");
  }
}
