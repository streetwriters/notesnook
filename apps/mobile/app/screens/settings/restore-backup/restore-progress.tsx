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

import { format, LegacyBackupFile, logManager } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useRef, useState, useSyncExternalStore } from "react";
import { Platform, View } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import { unzip } from "react-native-zip-archive";
import { Radius, Spacing } from "../../../common/design/spacing";
import { DatabaseLogger, db } from "../../../common/database";
import { deleteCacheFileByName } from "../../../common/filesystem/io";
import { cacheDir, copyFileAsync } from "../../../common/filesystem/utils";
import DialogButtons from "../../../components/dialog/dialog-buttons";
import {
  hideDialog,
  presentDialog
} from "../../../components/dialog/functions";
import AppIcon from "../../../components/ui/AppIcon";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  createFormRef,
  FormInput,
  validators
} from "../../../components/ui/input/form-input";
import { ProgressBarComponent } from "../../../components/ui/svg/lazy";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { ToastManager } from "../../../services/event-manager";
import { DDS } from "../../../services/device-detection";
import Navigation from "../../../services/navigation";
import { refreshAllStores } from "../../../stores/create-db-collection-store";
import { getContainerBorder } from "../../../utils/colors";
import { getElevationStyle } from "../../../utils/elevation";

export type PasswordOrKey = { password?: string; encryptionKey?: string };

type Mode = "progress" | "password" | "confirm" | "error";

type RestoreProgressState = {
  mode: Mode;
  title?: string;
  paragraph?: string;
  icon?: string;
  progress?: string;
  confirmTitle?: string;
  confirmParagraph?: string;
  errorMessage?: string;
};

let state: RestoreProgressState = { mode: "progress" };
const listeners = new Set<() => void>();

let passwordResolve: ((value: PasswordOrKey) => void) | null = null;
let passwordReject: ((reason?: unknown) => void) | null = null;
let passwordVerify:
  | ((passwordOrKey: PasswordOrKey) => Promise<string | undefined>)
  | null = null;
let confirmResolve: ((value: boolean) => void) | null = null;
let retryHandler: (() => void) | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<RestoreProgressState>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function clearPending() {
  passwordResolve = null;
  passwordReject = null;
  passwordVerify = null;
  confirmResolve = null;
  retryHandler = null;
}

function openDialog() {
  presentDialog({
    context: "global",
    disableBackdropClosing: true,
    onClose: () => {
      const resolvePassword = passwordResolve;
      const resolveConfirm = confirmResolve;
      clearPending();
      resolvePassword?.({});
      resolveConfirm?.(false);
    },
    component: () => <RestoreProgressDialog />
  });
}

const RestoreProgress = {
  present(options: { title?: string; paragraph?: string; icon?: string }) {
    clearPending();
    state = { mode: "progress", progress: undefined, ...options };
    emit();
    openDialog();
  },
  update(progress: string) {
    setState({ progress });
  },
  requestConfirmation(options: {
    title?: string;
    paragraph?: string;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      confirmResolve = resolve;
      setState({
        mode: "confirm",
        confirmTitle: options.title,
        confirmParagraph: options.paragraph
      });
    });
  },
  requestPassword(
    verify: (passwordOrKey: PasswordOrKey) => Promise<string | undefined>
  ): Promise<PasswordOrKey> {
    return new Promise<PasswordOrKey>((resolve, reject) => {
      passwordVerify = verify;
      passwordResolve = resolve;
      passwordReject = reject;
      setState({ mode: "password" });
    });
  },
  showError(error: Error, onRetry: () => void) {
    clearPending();
    retryHandler = onRetry;
    setState({
      mode: "error",
      errorMessage: error.message || strings.somethingWentWrong()
    });
    openDialog();
  },
  end() {
    clearPending();
    hideDialog();
  }
};

const RESTORE_CANCELLED = new Error("restore-cancelled");

const getPasswordError = (e: unknown): string | undefined => {
  const message = e instanceof Error ? e.message : "";
  if (message === "Incorrect password.") return strings.passwordIncorrect();
  if (message === "Invalid encryption key.")
    return strings.invalid(strings.encryptionKey());
  return undefined;
};

const verifyWithImport =
  (importBackup: (passwordOrKey: PasswordOrKey) => Promise<unknown>) =>
  async (passwordOrKey: PasswordOrKey): Promise<string | undefined> => {
    try {
      await importBackup(passwordOrKey);
      return undefined;
    } catch (e) {
      const error = getPasswordError(e);
      if (error) return error;
      throw e;
    }
  };

export const restoreBackup = async (options: {
  uri: string;
  deleteFile?: boolean;
  confirm?: boolean;
  name?: string;
}) => {
  const confirmRestore = () =>
    RestoreProgress.requestConfirmation({
      title: options.name
        ? `${strings.restore()} ${options.name}`
        : strings.restore(),
      paragraph: strings.restoreBackupConfirm()
    });

  try {
    if (
      !options.uri.endsWith(".nnbackup") &&
      !options.uri.endsWith(".nnbackupz")
    ) {
      throw new Error(
        `Invalid backup file selected. Only .nnbackup and .nnbackupz files can be restored.`
      );
    }

    const isLegacyBackup = options.uri.endsWith(".nnbackup");

    RestoreProgress.present({
      title: strings.restoring(),
      paragraph: strings.preparingBackupRestore(),
      icon: "arrows-clockwise"
    });

    let filePath = options.uri;
    let deleteBackupFile = options.deleteFile;

    if (!isLegacyBackup) {
      if (Platform.OS === "android") {
        RestoreProgress.update(strings.copyingBackupFileToCache());
        const cacheFile = `file://${RNFetchBlob.fs.dirs.CacheDir}/backup.zip`;
        if (await RNFetchBlob.fs.exists(cacheFile)) {
          await RNFetchBlob.fs.unlink(cacheFile);
        }

        await RNFetchBlob.fs.createFile(cacheFile, "", "utf8");
        if (filePath.startsWith("content://")) {
          await copyFileAsync(filePath, cacheFile);
        } else {
          await RNFetchBlob.fs.cp(filePath, cacheFile);
        }
        filePath = cacheFile;
        deleteBackupFile = true;
      }

      const zipOutputFolder = `${cacheDir}/backup_extracted`;
      if (await RNFetchBlob.fs.exists(zipOutputFolder)) {
        await RNFetchBlob.fs.unlink(zipOutputFolder);
        await RNFetchBlob.fs.mkdir(zipOutputFolder);
      }
      RestoreProgress.update(strings.extractingFiles());
      await unzip(filePath, zipOutputFolder);

      const extractedBackupFiles = await RNFetchBlob.fs.ls(zipOutputFolder);

      const extractedAttachments = extractedBackupFiles.includes("attachments")
        ? await RNFetchBlob.fs.ls(`${zipOutputFolder}/attachments`)
        : [];

      const attachmentsKeyPath: any = extractedAttachments?.find(
        (path) => path === ".attachments_key"
      );
      const attachmentsKey = attachmentsKeyPath
        ? await JSON.parse(
            await RNFetchBlob.fs.readFile(
              `${zipOutputFolder}/attachments/${attachmentsKeyPath}`,
              "utf8"
            )
          )
        : undefined;

      let count = 0;
      let confirmed = false;
      await db.transaction(async () => {
        let passwordOrKey: PasswordOrKey | undefined = undefined;
        for (const path of extractedBackupFiles) {
          if (path === ".nnbackup" || path === "attachments") continue;

          const filePath = `${zipOutputFolder}/${path}`;
          const data = await RNFetchBlob.fs.readFile(filePath, "utf8");
          const backup = JSON.parse(data);

          const isEncryptedBackup = backup.encrypted;

          const importBackup = (passwordOrKey: PasswordOrKey) =>
            db.backup.import(backup, {
              ...passwordOrKey,
              attachmentsKey: attachmentsKey
            });

          if (!isEncryptedBackup) {
            if (options.confirm && !confirmed) {
              confirmed = true;
              if (!(await confirmRestore())) throw RESTORE_CANCELLED;
            }
            RestoreProgress.update(
              `${strings.restoringBackup()} (${count++}/${
                extractedBackupFiles.length
              })`
            );
            await importBackup({});
            continue;
          }

          RestoreProgress.update(
            `${strings.restoringBackup()} (${count++}/${
              extractedBackupFiles.length
            })`
          );

          if (!passwordOrKey) {
            passwordOrKey = await RestoreProgress.requestPassword(
              verifyWithImport(importBackup)
            );
            if (!passwordOrKey.encryptionKey && !passwordOrKey.password) {
              throw RESTORE_CANCELLED;
            }
            continue;
          }

          await importBackup(passwordOrKey);
        }
      });

      await db.initCollections();
      count = 0;
      for (const path of extractedAttachments) {
        if (path === ".attachments_key") continue;
        RestoreProgress.update(
          `Restoring attachments (${count++}/${extractedAttachments.length})`
        );
        const hash = path;
        const attachment = await db.attachments.attachment(hash as string);
        if (!attachment) continue;

        await deleteCacheFileByName(hash);
        await RNFetchBlob.fs.cp(
          `${zipOutputFolder}/attachments/${hash}`,
          `${cacheDir}/${hash}`
        );
      }
      RestoreProgress.update(strings.cleaningUp());
      // Remove files from cache
      RNFetchBlob.fs.unlink(zipOutputFolder).catch(() => {
        /* empty */
      });
      if (Platform.OS === "android" || deleteBackupFile) {
        RNFetchBlob.fs.unlink(filePath).catch(() => {
          /* empty */
        });
      }
    } else {
      RestoreProgress.update(strings.readingBackupFile());
      const rawData =
        Platform.OS === "android"
          ? await ScopedStorage.readFile(filePath, "utf8")
          : await RNFetchBlob.fs.readFile(filePath, "utf8");
      const backup: LegacyBackupFile = JSON.parse(rawData) as LegacyBackupFile;

      const isEncryptedBackup =
        typeof backup.data !== "string" && backup.data.cipher;

      await db.transaction(async () => {
        const importBackup = (passwordOrKey: PasswordOrKey) =>
          db.backup.import(backup, passwordOrKey);

        if (!isEncryptedBackup) {
          if (options.confirm && !(await confirmRestore())) {
            throw RESTORE_CANCELLED;
          }
          RestoreProgress.update(strings.restoringBackup());
          await importBackup({});
          return;
        }

        const passwordOrKey = await RestoreProgress.requestPassword(
          verifyWithImport(importBackup)
        );
        if (!passwordOrKey.encryptionKey && !passwordOrKey.password) {
          throw RESTORE_CANCELLED;
        }
      });
    }

    ToastManager.show({
      heading: strings.backupRestored(),
      type: "success"
    });

    await db.initCollections();
    refreshAllStores();
    Navigation.queueRoutesForUpdate();
    RestoreProgress.end();
  } catch (e) {
    if (e === RESTORE_CANCELLED) {
      RestoreProgress.end();
      return;
    }
    DatabaseLogger.error(e as Error);
    RestoreProgress.showError(e as Error, () => restoreBackup(options));
  }
};

function RestoreProgressDialog() {
  const { colors } = useThemeColors();
  const current = useSyncExternalStore(subscribe, getSnapshot);
  const formRef = useRef(createFormRef({ password: "" }));
  const [isEncryptionKey, setIsEncryptionKey] = useState(false);

  const onSubmitPassword = async () => {
    if (!formRef.current.validate()) return;
    const value = formRef.current.getValue("password");
    const passwordOrKey: PasswordOrKey = {
      encryptionKey: isEncryptionKey ? value : undefined,
      password: isEncryptionKey ? undefined : value
    };

    const verify = passwordVerify;
    const resolve = passwordResolve;
    const reject = passwordReject;

    setState({ mode: "progress", progress: strings.decryptingBackup() });

    let error: string | undefined;
    try {
      error = await verify?.(passwordOrKey);
    } catch (e) {
      clearPending();
      reject?.(e);
      return;
    }

    if (error) {
      formRef.current.setError("password", error);
      setState({ mode: "password" });
      return;
    }

    clearPending();
    resolve?.(passwordOrKey);
  };

  const onCancelPassword = () => {
    const resolve = passwordResolve;
    clearPending();
    resolve?.({});
  };

  const onConfirm = () => {
    const resolve = confirmResolve;
    confirmResolve = null;
    setState({ mode: "progress", progress: strings.restoringBackup() });
    resolve?.(true);
  };

  const onCancelConfirm = () => {
    const resolve = confirmResolve;
    confirmResolve = null;
    resolve?.(false);
  };

  const onRetry = () => {
    const retry = retryHandler;
    retryHandler = null;
    retry?.();
  };

  const onCloseError = () => {
    retryHandler = null;
    hideDialog();
  };

  const onCopyLogs = async () => {
    try {
      const groups = await logManager?.get();
      const logsText =
        groups?.[0]?.logs?.map((log) => format(log)).join("\n") ?? "";
      Clipboard.setString(
        `${current.errorMessage ?? ""}\n\n${logsText}`.trim()
      );
      ToastManager.show({
        heading: strings.logsCopied(),
        type: "success",
        context: "local"
      });
    } catch (e) {
      ToastManager.show({
        heading: strings.failedToCopyToClipboard(),
        type: "error",
        context: "local"
      });
    }
  };

  const isError = current.mode === "error";

  const title =
    current.mode === "password"
      ? strings.backupEncrypted()
      : current.mode === "confirm"
        ? current.confirmTitle
        : current.mode === "error"
          ? strings.restoreFailed()
          : current.title;

  const paragraph =
    current.mode === "password"
      ? strings.backupEnterPassword()
      : current.mode === "confirm"
        ? current.confirmParagraph
        : current.mode === "error"
          ? current.errorMessage
          : current.progress || current.paragraph;

  const iconName =
    current.mode === "password"
      ? "lock"
      : current.mode === "error"
        ? "warning-circle"
        : current.icon || "arrows-clockwise";

  return (
    <View
      style={{
        ...getElevationStyle(5),
        width: DDS.isTab ? 400 : "85%",
        borderRadius: Radius.LG,
        backgroundColor: colors.primary.background,
        paddingVertical: Spacing.LEVEL_4,
        gap: Spacing.LEVEL_4,
        ...getContainerBorder(colors.primary.border, 0.5),
        overflow: "hidden"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Spacing.LEVEL_2,
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: Radius.XS,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isError
              ? colors.error.background
              : colors.secondary.background
          }}
        >
          <AppIcon
            name={iconName}
            iconFamily="notesnook"
            size={20}
            color={isError ? colors.error.icon : colors.primary.icon}
          />
        </View>
        <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
          <Heading
            fontSize="LG"
            lineHeight="100%"
            color={colors.primary.heading}
          >
            {title}
          </Heading>
          <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
            {paragraph}
          </Paragraph>
        </View>
      </View>

      {current.mode === "error" ? (
        <>
          <View style={{ paddingHorizontal: Spacing.LEVEL_3 }}>
            <Button
              title={strings.copyLogs()}
              icon="copy"
              iconFamily="notesnook"
              type="secondary"
              width="100%"
              onPress={onCopyLogs}
            />
          </View>
          <DialogButtons
            positiveTitle={strings.retry()}
            positiveType="accent"
            negativeTitle={strings.close()}
            onPressPositive={onRetry}
            onPressNegative={onCloseError}
          />
        </>
      ) : current.mode === "confirm" ? (
        <DialogButtons
          positiveTitle={strings.restore()}
          positiveType="accent"
          onPressPositive={onConfirm}
          onPressNegative={onCancelConfirm}
        />
      ) : current.mode === "password" ? (
        <>
          <View
            style={{
              paddingHorizontal: Spacing.LEVEL_3,
              gap: Spacing.LEVEL_2
            }}
          >
            <FormInput
              name="password"
              formRef={formRef}
              placeholder={
                isEncryptionKey ? strings.encryptionKey() : strings.password()
              }
              secureTextEntry
              autoFocus
              returnKeyType="done"
              validators={[validators.required(strings.passwordNotEntered())]}
              onSubmitEditing={onSubmitPassword}
            />
            <Checkbox
              checked={isEncryptionKey}
              onPress={() => setIsEncryptionKey(!isEncryptionKey)}
              title={strings.useEncryptionKey()}
            />
          </View>

          <DialogButtons
            positiveTitle={strings.restore()}
            positiveType="accent"
            onPressPositive={onSubmitPassword}
            onPressNegative={onCancelPassword}
          />
        </>
      ) : (
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            paddingHorizontal: Spacing.LEVEL_3
          }}
        >
          <ProgressBarComponent
            height={8}
            width={null}
            style={{ flex: 1 }}
            animated={true}
            useNativeDriver
            indeterminate
            indeterminateAnimationDuration={2000}
            unfilledColor={colors.secondary.background}
            color={colors.primary.accent}
            borderWidth={0}
          />
        </View>
      )}
    </View>
  );
}
