/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import {
  showFeatureDialog,
  showLoadingDialog,
  showPasswordDialog,
  showReminderDialog
} from "../common/dialog-controller";
import Config from "../utils/config";
import { hashNavigate, getCurrentHash } from "../navigation";
import { db } from "./db";
import { sanitizeFilename } from "@notesnook/common";
import { isDesktop, isTesting } from "../utils/platform";
import { store as userstore } from "../stores/user-store";
import FileSaver from "file-saver";
import { showToast } from "../utils/toast";
import { SUBSCRIPTION_STATUS } from "./constants";
import { showFilePicker } from "../components/editor/picker";
import { logger } from "../utils/logger";
import { PATHS } from "@notesnook/desktop";
import { TaskManager } from "./task-manager";
import { EVENTS } from "@notesnook/core/common";
import { getFormattedDate } from "@notesnook/common";
import { desktop } from "./desktop-bridge";

export const CREATE_BUTTON_MAP = {
  notes: {
    title: "Add a note",
    onClick: () =>
      hashNavigate("/notes/create", { addNonce: true, replace: true })
  },
  notebooks: {
    title: "Create a notebook",
    onClick: () => hashNavigate("/notebooks/create", { replace: true })
  },
  topics: {
    title: "Create a topic",
    onClick: () => hashNavigate(`/topics/create`, { replace: true })
  },
  tags: {
    title: "Create a tag",
    onClick: () => hashNavigate(`/tags/create`, { replace: true })
  },
  reminders: {
    title: "Add a reminder",
    onClick: () => hashNavigate(`/reminders/create`, { replace: true })
  }
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

export async function createBackup() {
  const encryptBackups =
    userstore.get().isLoggedIn && Config.get("encryptBackups", false);
  const data = await showLoadingDialog({
    title: "Creating backup",
    subtitle: "We are creating a backup of your data. Please wait...",
    action: async () => {
      return await db.backup.export("web", encryptBackups);
    }
  });
  if (!data) {
    showToast("error", "Could not create a backup of your data.");
    return;
  }

  const filename = sanitizeFilename(`notesnook-backup-${getFormattedDate()}`);

  const ext = "nnbackup";
  if (isDesktop()) {
    const directory = Config.get(
      "backupStorageLocation",
      PATHS.backupsDirectory
    );
    const filePath = `${directory}/${filename}.${ext}`;
    await desktop?.integration.saveFile.query(filePath, data);
    showToast("success", `Backup saved at ${filePath}.`);
  } else {
    FileSaver.saveAs(new Blob([Buffer.from(data)]), `${filename}.${ext}`);
  }
}

export async function selectBackupFile() {
  const file = await showFilePicker({
    acceptedFileTypes: ".nnbackup,application/json"
  });
  if (!file) return;

  const reader = new FileReader();
  const backup = await new Promise((resolve) => {
    reader.addEventListener("load", (event) => {
      const text = event.target.result;
      try {
        resolve(JSON.parse(text));
      } catch (e) {
        alert(
          "Error: Could not read the backup file provided. Either it's corrupted or invalid."
        );
        resolve();
      }
    });
    reader.readAsText(file);
  });

  return { file, backup };
}

export async function importBackup() {
  const { backup } = await selectBackupFile();
  await restoreBackupFile(backup);
}

export async function restoreBackupFile(backup) {
  console.log("[restore]", backup);
  if (backup.data.iv && backup.data.salt) {
    await showPasswordDialog("ask_backup_password", async ({ password }) => {
      const error = await restore(backup, password);
      return !error;
    });
  } else {
    await TaskManager.startTask({
      title: "Restoring backup",
      subtitle: "This might take a while",
      type: "modal",
      action: (report) => {
        db.eventManager.subscribe(
          EVENTS.migrationProgress,
          ({ collection, total, current }) => {
            report({
              text: `Restoring ${collection}...`,
              current,
              total
            });
          }
        );

        report({ text: `Restoring...` });
        return restore(backup);
      }
    });
  }
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
  if (!user || !user.subscription || user.subscription?.expiry === 0) return;

  const consumed = totalSubscriptionConsumed(user);
  const isTrial = user?.subscription?.type === SUBSCRIPTION_STATUS.TRIAL;
  const isBasic = user?.subscription?.type === SUBSCRIPTION_STATUS.BASIC;
  if (isBasic && consumed >= 100) {
    await showReminderDialog("trialexpired");
  } else if (isTrial && consumed >= 75) {
    await showReminderDialog("trialexpiring");
  }
}

async function restore(backup, password) {
  try {
    await db.backup.import(backup, password);
    showToast("success", "Backup restored!");
  } catch (e) {
    logger.error(e, "Could not restore the backup");
    showToast("error", `Could not restore the backup: ${e.message || e}`);
  }
}
