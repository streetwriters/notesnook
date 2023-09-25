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
  showPasswordDialog,
  showReminderDialog
} from "./dialog-controller";
import Config from "../utils/config";
import { hashNavigate, getCurrentHash } from "../navigation";
import { db } from "./db";
import { sanitizeFilename } from "@notesnook/common";
import { store as userstore } from "../stores/user-store";
import { showToast } from "../utils/toast";
import { SUBSCRIPTION_STATUS } from "./constants";
import { readFile, showFilePicker } from "../utils/file-picker";
import { logger } from "../utils/logger";
import { PATHS } from "@notesnook/desktop";
import { TaskManager } from "./task-manager";
import { EVENTS } from "@notesnook/core/dist/common";
import { getFormattedDate } from "@notesnook/common";
import { createWritableStream } from "./desktop-bridge";
import { ZipStream } from "../utils/streams/zip-stream";
import { FeatureKeys } from "../dialogs/feature-dialog";
import { Entry, Reader } from "../utils/zip-reader";

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
  if (!!hash || IS_TESTING) return;
  const features: FeatureKeys[] = [];
  for (const feature of features) {
    if (!Config.get(`feature:${feature}`)) {
      await showFeatureDialog(feature);
    }
  }
}

export const DEFAULT_CONTEXT = { colors: [], tags: [], notebook: {} };

export async function createBackup() {
  const encryptBackups =
    userstore.get().isLoggedIn && Config.get("encryptBackups", false);

  const filename = sanitizeFilename(
    `notesnook-backup-${getFormattedDate(Date.now())}`
  );
  const directory = Config.get("backupStorageLocation", PATHS.backupsDirectory);
  const ext = "nnbackupz";
  const filePath = IS_DESKTOP_APP
    ? `${directory}/${filename}.${ext}`
    : `${filename}.${ext}`;

  const encoder = new TextEncoder();
  const error = await TaskManager.startTask<Error | void>({
    type: "modal",
    title: "Creating backup",
    subtitle: "We are creating a backup of your data. Please wait...",
    action: async (report) => {
      const writeStream = await createWritableStream(filePath);

      await new ReadableStream({
        start() {},
        async pull(controller) {
          for await (const file of db.backup!.export("web", encryptBackups)) {
            report({
              text: `Saving chunk ${file.path}`
            });
            controller.enqueue({
              path: file.path,
              data: encoder.encode(file.data)
            });
          }
          controller.close();
        }
      })
        .pipeThrough(new ZipStream())
        .pipeTo(writeStream);
    }
  });
  if (error) {
    showToast(
      "error",
      `Could not create a backup of your data: ${(error as Error).message}`
    );
    console.error(error);
  } else {
    showToast("success", `Backup saved at ${filePath}.`);
  }
}

export async function selectBackupFile() {
  const file = await showFilePicker({
    acceptedFileTypes: ".nnbackup,.nnbackupz"
  });
  if (!file) return;
  return file;
}

export async function importBackup() {
  const backupFile = await selectBackupFile();
  if (!backupFile) return;
  await restoreBackupFile(backupFile);
}

export async function restoreBackupFile(backupFile: File) {
  const isLegacy = !backupFile.name.endsWith(".nnbackupz");

  if (isLegacy) {
    const backup = JSON.parse(await readFile(backupFile));

    if (backup.data.iv && backup.data.salt) {
      await showPasswordDialog("ask_backup_password", async ({ password }) => {
        if (!password) return false;
        const error = await restoreWithProgress(backup, password);
        return !error;
      });
    } else {
      await restoreWithProgress(backup);
    }
    await db.initCollections();
  } else {
    const error = await TaskManager.startTask<Error | void>({
      title: "Restoring backup",
      subtitle: "Please wait while we restore your backup...",
      type: "modal",
      action: async (report) => {
        let cachedPassword: string | undefined = undefined;
        const { read, totalFiles } = await Reader(backupFile);
        const entries: Entry[] = [];
        let filesProcessed = 0;

        let isValid = false;
        for await (const entry of read()) {
          if (entry.name === ".nnbackup") {
            isValid = true;
            continue;
          }
          entries.push(entry);
        }
        if (!isValid) throw new Error("Invalid backup.");

        for (const entry of entries) {
          const backup = JSON.parse(await entry.text());
          if (backup.encrypted) {
            if (!cachedPassword) {
              const result = await showPasswordDialog(
                "ask_backup_password",
                async ({ password }) => {
                  if (!password) return false;
                  await db.backup?.import(backup, password);
                  cachedPassword = password;
                  return true;
                }
              );
              if (!result) break;
            } else await db.backup?.import(backup, cachedPassword);
          } else {
            await db.backup?.import(backup, null);
          }

          report({
            total: totalFiles,
            text: `Processed ${entry.name}`,
            current: filesProcessed++
          });
        }
        await db.initCollections();
      }
    });
    if (error) {
      console.error(error);
      showToast("error", `Failed to restore backup: ${error.message}`);
    }
  }
}

async function restoreWithProgress(
  backup: Record<string, unknown>,
  password?: string
) {
  return await TaskManager.startTask<Error | void>({
    title: "Restoring backup",
    subtitle: "This might take a while",
    type: "modal",
    action: (report) => {
      db.eventManager.subscribe(
        EVENTS.migrationProgress,
        ({
          collection,
          total,
          current
        }: {
          collection: string;
          total: number;
          current: number;
        }) => {
          report({
            text: `Restoring ${collection}...`,
            current,
            total
          });
        }
      );

      report({ text: `Restoring...` });
      return restore(backup, password);
    }
  });
}

export async function verifyAccount() {
  if (!(await db.user?.getUser())) return true;
  return showPasswordDialog("verify_account", ({ password }) => {
    return db.user?.verifyPassword(password) || false;
  });
}

export function totalSubscriptionConsumed(user: User) {
  if (!user) return 0;
  const start = user.subscription?.start;
  const end = user.subscription?.expiry;
  if (!start || !end) return 0;

  const total = end - start;
  const consumed = Date.now() - start;

  return Math.round((consumed / total) * 100);
}

export async function showUpgradeReminderDialogs() {
  if (IS_TESTING) return;

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

async function restore(backup: Record<string, unknown>, password?: string) {
  try {
    await db.backup?.import(backup, password);
    showToast("success", "Backup restored!");
  } catch (e) {
    logger.error(e as Error, "Could not restore the backup");
    showToast(
      "error",
      `Could not restore the backup: ${(e as Error).message || e}`
    );
  }
}
