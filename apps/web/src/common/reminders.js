import Config from "../utils/config";
import { createBackup, verifyAccount } from "./index";
import { db } from "./db";
import { store as appStore } from "../stores/app-store";
import * as Icon from "../components/icons";
import dayjs from "dayjs";
import {
  showBackupDialog,
  showRecoveryKeyDialog,
} from "../common/dialog-controller";
import { hardNavigate, hashNavigate } from "../navigation";
import { isDesktop, isTesting } from "../utils/platform";
import saveFile from "../commands/save-file";
import { PATHS } from "@notesnook/desktop/paths";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { showToast } from "../utils/toast";

export async function shouldAddBackupReminder() {
  if (isIgnored("backup")) return false;

  const backupReminderOffset = Config.get(
    "backupReminderOffset",
    isUserPremium() ? 1 : 0
  );
  if (!backupReminderOffset) return false;

  const lastBackupTime = await db.backup.lastBackupTime();
  if (!lastBackupTime) return true;

  const offsetToDays =
    backupReminderOffset === 1 ? 1 : backupReminderOffset === 2 ? 7 : 30;

  return dayjs(lastBackupTime).add(offsetToDays, "d").isBefore(dayjs());
}

export async function shouldAddRecoveryKeyBackupReminder() {
  if (isIgnored("recoverykey")) return false;

  const recoveryKeyBackupDate = Config.get("recoveryKeyBackupDate", 0);
  if (!recoveryKeyBackupDate) return true;
  return dayjs(recoveryKeyBackupDate).add(30, "d").isBefore(dayjs());
}

export async function shouldAddLoginReminder() {
  const user = await db.user.getUser();
  if (!user) return true;
}

export async function shouldAddConfirmEmailReminder() {
  const user = await db.user.getUser();
  return !user?.isEmailConfirmed;
}

export const Reminders = {
  backup: {
    key: "backup",
    subtitle: "Create a backup to keep your notes safe",
    dismissable: true,
    title: "Back up your data",
    action: async () => {
      if (await verifyAccount()) await createBackup();
    },
    icon: Icon.Backup,
  },
  login: {
    key: "login",
    title: "Login to sync your notes",
    subtitle: "You are not logged in",
    action: () => hardNavigate("/login"),
    icon: Icon.User,
  },
  email: {
    key: "email",
    title: "Your email is not confirmed",
    subtitle: "Please confirm your email to sync your notes",
    action: () => hashNavigate("/email/verify"),
    icon: Icon.Email,
  },
  recoverykey: {
    key: "recoverykey",
    title: "Backup your recovery key",
    subtitle: "Keep your recovery key safe",
    dismissable: true,
    action: async () => {
      if (await verifyAccount()) await showRecoveryKeyDialog();
    },
    icon: Icon.Warn,
  },
};

export async function resetReminders() {
  const reminders = [];

  if (await shouldAddBackupReminder()) {
    if (isDesktop()) {
      const { data, filename, ext } = await createBackup(false);
      const directory = Config.get(
        "backupStorageLocation",
        PATHS.backupsDirectory
      );
      const filePath = `${directory}/${filename}.${ext}`;
      saveFile(filePath, data);
      showToast("success", `Backup saved at ${filePath}.`);
    } else if (isUserPremium() && !isTesting()) {
      await showBackupDialog();
    }
  }
  if (await shouldAddLoginReminder()) {
    reminders.push({ type: "login", priority: "low" });
  }
  if (await shouldAddConfirmEmailReminder()) {
    reminders.push({ type: "email", priority: "high" });
  }
  if (await shouldAddRecoveryKeyBackupReminder()) {
    reminders.push({ type: "recoverykey", priority: "high" });
  }
  appStore.get().setReminders(...reminders);
}

function isIgnored(key) {
  return Config.get(`ignored:${key}`, false);
}
