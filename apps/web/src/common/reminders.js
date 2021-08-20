import Config from "../utils/config";
import { createBackup, verifyAccount } from "./index";
import { db } from "./db";
import { store as appStore } from "../stores/app-store";
import * as Icon from "../components/icons";
import dayjs from "dayjs";
import { showRecoveryKeyDialog } from "../common/dialog-controller";
import { hashNavigate, navigate } from "../navigation";
import { isDesktop } from "../utils/platform";
import saveFile from "../commands/save-file";
import { PATHS } from "@notesnook/desktop/paths";

export async function shouldAddBackupReminder() {
  const backupReminderOffset = Config.get("backupReminderOffset", 0);
  if (!backupReminderOffset) return false;

  const lastBackupTime = await db.backup.lastBackupTime();
  const offsetToDays =
    backupReminderOffset === 1 ? 1 : backupReminderOffset === 2 ? 7 : 30;

  return dayjs(lastBackupTime).add(offsetToDays, "d").isBefore(dayjs());
}

export async function shouldAddRecoveryKeyBackupReminder() {
  const recoveryKeyBackupDate = Config.get("recoveryKeyBackupDate", 0);
  if (!recoveryKeyBackupDate) return true;
  return dayjs(recoveryKeyBackupDate).add(7, "d").isBefore(dayjs());
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
    subtitle: "Create a backup to keep your notes safe",
    title: "Back up your data",
    action: async () => {
      if (await verifyAccount()) await createBackup();
    },
    icon: Icon.Backup,
  },
  login: {
    title: "Login to sync your notes",
    subtitle: "You are not logged in",
    action: () => navigate("/login"),
    icon: Icon.User,
  },
  email: {
    title: "Please confirm your email",
    subtitle: "Confirm your email to sync notes",
    action: () => hashNavigate("/email/verify"),
    icon: Icon.Email,
  },
  recoverykey: {
    title: "Backup your recovery key",
    subtitle: "Keep your recovery key safe",
    action: async () => {
      if (await verifyAccount()) await showRecoveryKeyDialog();
    },
    icon: Icon.Warn,
  },
};

export async function resetReminders() {
  appStore.set((state) => (state.reminders = []));
  if (await shouldAddBackupReminder()) {
    if (isDesktop()) {
      const { data, filename, ext } = await createBackup(false);
      const directory = Config.get(
        "backupStorageLocation",
        PATHS.backupsDirectory
      );
      saveFile(`${directory}/${filename}.${ext}`, data);
    } else {
      appStore.addReminder("backup", "high");
    }
  }
  if (await shouldAddLoginReminder()) {
    appStore.addReminder("login", "low");
  }
  if (await shouldAddConfirmEmailReminder()) {
    appStore.addReminder("email", "high");
  }
  if (await shouldAddRecoveryKeyBackupReminder()) {
    appStore.addReminder("recoverykey", "high");
  }
}
