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

import Config from "../utils/config";
import { hashNavigate, getCurrentHash } from "../navigation";
import { db } from "./db";
import { sanitizeFilename } from "@notesnook/common";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useSettingStore } from "../stores/setting-store";
import { showToast } from "../utils/toast";
import { SUBSCRIPTION_STATUS } from "./constants";
import { readFile, showFilePicker } from "../utils/file-picker";
import { logger } from "../utils/logger";
import { PATHS } from "@notesnook/desktop";
import { TaskManager } from "./task-manager";
import { EVENTS } from "@notesnook/core";
import { createWritableStream } from "./desktop-bridge";
import { FeatureDialog, FeatureKeys } from "../dialogs/feature-dialog";
import { User } from "@notesnook/core";
import { LegacyBackupFile } from "@notesnook/core";
import { useEditorStore } from "../stores/editor-store";
import { formatDate } from "@notesnook/core";
import { showPasswordDialog } from "../dialogs/password-dialog";
import { BackupPasswordDialog } from "../dialogs/backup-password-dialog";
import { ReminderDialog } from "../dialogs/reminder-dialog";
import { Cipher, SerializedKey } from "@notesnook/crypto";
import { ChunkedStream } from "../utils/streams/chunked-stream";
import { isFeatureSupported } from "../utils/feature-check";
import { strings } from "@notesnook/intl";
import { ABYTES, streamablefs } from "../interfaces/fs";
import { type ZipEntry } from "../utils/streams/unzip-stream";
import { ZipFile } from "../utils/streams/zip-stream";

export const CREATE_BUTTON_MAP = {
  notes: {
    title: strings.addItem("note"),
    onClick: () => useEditorStore.getState().newSession()
  },
  notebooks: {
    title: strings.addItem("notebook"),
    onClick: () => hashNavigate("/notebooks/create", { replace: true })
  },
  tags: {
    title: strings.addItem("tag"),
    onClick: () => hashNavigate(`/tags/create`, { replace: true })
  },
  reminders: {
    title: strings.addItem("reminder"),
    onClick: () => hashNavigate(`/reminders/create`, { replace: true })
  }
};

export async function introduceFeatures() {
  const hash = getCurrentHash().replace("#", "");
  if (!!hash || IS_TESTING) return;
  const features: FeatureKeys[] = [];
  for (const feature of features) {
    if (!Config.get(`feature:${feature}`)) {
      await FeatureDialog.show({ featureName: feature });
    }
  }
}

export const DEFAULT_CONTEXT = { colors: [], tags: [], notebook: {} };

export async function createBackup(
  options: {
    rescueMode?: boolean;
    noVerify?: boolean;
    mode?: "full" | "partial";
    background?: boolean;
  } = { mode: "partial" }
) {
  const { rescueMode, noVerify, mode, background } = options;
  const { isLoggedIn } = useUserStore.getState();
  const { encryptBackups, toggleEncryptBackups } = useSettingStore.getState();
  if (!isLoggedIn && encryptBackups) toggleEncryptBackups();

  const verified =
    rescueMode || encryptBackups || noVerify || (await verifyAccount());
  if (!verified) {
    showToast("error", `${strings.backupFailed()}: ${strings.verifyFailed()}.`);
    return false;
  }

  const encryptedBackups = !rescueMode && isLoggedIn && encryptBackups;

  const filename = sanitizeFilename(
    `${formatDate(Date.now(), {
      type: "date-time",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24-hour"
    })}-${new Date().getSeconds()}${mode === "full" ? "-full" : ""}`,
    { replacement: "-" }
  );
  const directory = Config.get("backupStorageLocation", PATHS.backupsDirectory);
  const ext = "nnbackupz";
  const filePath = IS_DESKTOP_APP
    ? `${directory}/${filename}.${ext}`
    : `${filename}.${ext}`;

  const encoder = new TextEncoder();
  const error = await TaskManager.startTask<Error | void>({
    type: background ? "status" : "modal",
    id: "creating-backup",
    title: strings.backingUpData(mode),
    subtitle: strings.backingUpDataWait(),
    action: async (report) => {
      const { createZipStream } = await import("../utils/streams/zip-stream");
      const writeStream = await createWritableStream(filePath);
      await new ReadableStream<ZipFile>({
        start() {},
        async pull(controller) {
          for await (const output of db.backup!.export({
            type: "web",
            encrypt: encryptedBackups,
            mode
          })) {
            if (output.type === "file") {
              const file = output;
              report({
                text: background
                  ? `Creating backup (${file.path})`
                  : `Saving file ${file.path}`
              });
              controller.enqueue({
                path: file.path,
                data: encoder.encode(file.data)
              });
            } else if (output.type === "attachment") {
              report({
                text: background
                  ? `Creating backup (${output.hash})`
                  : `Saving attachment ${output.hash}`,
                total: output.total,
                current: output.current
              });
              const handle = await streamablefs.readFile(output.hash);
              if (!handle) continue;
              controller.enqueue({
                path: output.path,
                data: handle.readable
              });
            }
          }
          controller.close();
        }
      })
        .pipeThrough(createZipStream())
        .pipeTo(writeStream);
    }
  });
  if (error) {
    showToast(
      "error",
      `${strings.backupFailed()}: ${(error as Error).message}`
    );
    console.error(error);
  } else {
    showToast("success", `${strings.backupSavedAt(filePath)}`);
    return true;
  }
  return false;
}

export async function selectBackupFile() {
  const [file] = await showFilePicker({
    acceptedFileTypes: ".nnbackup,.nnbackupz"
  });
  if (!file) return;
  return file;
}

export async function importBackup() {
  const backupFile = await selectBackupFile();
  if (!backupFile) return false;
  await restoreBackupFile(backupFile);
  return true;
}

export async function restoreBackupFile(backupFile: File) {
  const isLegacy = !backupFile.name.endsWith(".nnbackupz");

  if (isLegacy) {
    const backup = JSON.parse(await readFile(backupFile));

    if (backup.data.iv && backup.data.salt) {
      await BackupPasswordDialog.show({
        validate: async ({ password, key }) => {
          if (!password && !key) return false;
          const error = await restoreWithProgress(backup, password, key);
          return !error;
        }
      });
    } else {
      await restoreWithProgress(backup);
    }
    await db.initCollections();
  } else {
    const error = await TaskManager.startTask<Error | void>({
      title: strings.restoringBackup(),
      subtitle: strings.restoringBackupDesc(),
      type: "modal",
      action: async (report) => {
        const { createUnzipIterator } = await import(
          "../utils/streams/unzip-stream"
        );

        let cachedPassword: string | undefined = undefined;
        let cachedKey: string | undefined = undefined;
        // const { read, totalFiles } = await Reader(backupFile);
        const entries: ZipEntry[] = [];
        const attachments: ZipEntry[] = [];
        let attachmentsKey: SerializedKey | Cipher<"base64"> | undefined;
        let filesProcessed = 0;

        let isValid = false;
        for await (const entry of createUnzipIterator(backupFile)) {
          if (entry.name === ".nnbackup") {
            isValid = true;
            continue;
          }
          if (entry.name === "attachments/.attachments_key")
            attachmentsKey = JSON.parse(await entry.text()) as
              | SerializedKey
              | Cipher<"base64">;
          else if (entry.name.startsWith("attachments/"))
            attachments.push(entry);
          else entries.push(entry);
        }
        if (!isValid)
          console.warn(
            "The backup file does not contain the verification .nnbackup file."
          );

        await db.transaction(async () => {
          for (const entry of entries) {
            const backup = JSON.parse(await entry.text());
            if (backup.encrypted) {
              if (!cachedPassword && !cachedKey) {
                const result = await BackupPasswordDialog.show({
                  validate: async ({ password, key: encryptionKey }) => {
                    if (!password && !encryptionKey) return false;
                    await db.backup?.import(backup, {
                      password,
                      encryptionKey,
                      attachmentsKey
                    });
                    cachedPassword = password;
                    cachedKey = encryptionKey;
                    return true;
                  }
                });
                if (!result) break;
              } else
                await db.backup?.import(backup, {
                  password: cachedPassword,
                  encryptionKey: cachedKey,
                  attachmentsKey
                });
            } else {
              await db.backup?.import(backup, { attachmentsKey });
            }

            report({
              text: `Processed ${entry.name}`,
              current: filesProcessed++,
              total: entries.length
            });
          }
        });
        await db.initCollections();

        let current = 0;
        for (const entry of attachments) {
          const hash = entry.name.replace("attachments/", "");

          report({
            text: `Importing attachment ${hash}`,
            total: attachments.length,
            current: current++
          });

          const attachment = await db.attachments.attachment(hash);
          if (!attachment) continue;

          await streamablefs.deleteFile(attachment.hash);
          const handle = await streamablefs.createFile(
            attachment.hash,
            attachment.size,
            attachment.mimeType
          );
          await entry
            .stream()
            .pipeThrough(
              new ChunkedStream(
                attachment.chunkSize + ABYTES,
                isFeatureSupported("opfs") ? "copy" : "nocopy"
              )
            )
            .pipeTo(handle.writeable);
        }
      }
    });
    if (error) {
      console.error(error);
      showToast("error", `${strings.restoreFailed()}: ${error.message}`);
    }
  }
}

async function restoreWithProgress(
  backup: LegacyBackupFile,
  password?: string,
  key?: string
) {
  return await TaskManager.startTask<Error | void>({
    title: strings.restoringBackup(),
    subtitle: strings.restoringBackupDesc(),
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
            text: strings.restoringCollection(collection),
            current,
            total
          });
        }
      );

      report({ text: strings.restoring() });
      return restore(backup, password, key);
    }
  });
}

export async function verifyAccount() {
  if (!(await db.user?.getUser())) return true;
  return await showPasswordDialog({
    title: strings.verifyItsYou(),
    subtitle: strings.enterAccountPasswordDesc(),
    inputs: {
      password: {
        label: strings.password(),
        autoComplete: "current-password"
      }
    },
    validate: async ({ password }) => {
      return !!password && (await db.user?.verifyPassword(password));
    }
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

  const user = useUserStore.getState().user;
  if (!user || !user.subscription || user.subscription?.expiry === 0) return;

  const consumed = totalSubscriptionConsumed(user);
  const isTrial = user.subscription?.type === SUBSCRIPTION_STATUS.TRIAL;
  const isBasic = user.subscription?.type === SUBSCRIPTION_STATUS.BASIC;
  if (isBasic && consumed >= 100) {
    await ReminderDialog.show({ reminderKey: "trialexpired" });
  } else if (isTrial && consumed >= 75) {
    await ReminderDialog.show({ reminderKey: "trialexpiring" });
  }
}

async function restore(
  backup: LegacyBackupFile,
  password?: string,
  encryptionKey?: string
) {
  try {
    await db.backup?.import(backup, { password, encryptionKey });
    showToast("success", strings.backupRestored());
  } catch (e) {
    logger.error(e as Error, "Could not restore the backup");
    showToast(
      "error",
      `${strings.backupFailed()}: ${(e as Error).message || e}`
    );
  }
}
