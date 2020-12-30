import Config from "../utils/config";
import { createBackup, db } from "./index";
import { store as appStore } from "../stores/app-store";
import * as Icon from "../components/icons";
import dayjs from "dayjs";
import { showSignUpDialog } from "../components/dialogs/signupdialog";
import { showToast } from "../utils/toast";
import { showRecoveryKeyDialog } from "../components/dialogs/recoverykeydialog";

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
  if (!recoveryKeyBackupDate) return false;
  return dayjs(recoveryKeyBackupDate).add(7, "d").isBefore(dayjs());
}

export async function shouldAddSignupReminder() {
  const user = await db.user.getUser();
  if (!user) return true;
}

export async function shouldAddConfirmEmailReminder() {
  const user = await db.user.getUser();
  return !user?.isEmailConfirmed;
}

export const Reminders = {
  backup: {
    title: "Back up your data now!",
    action: createBackup,
    icon: Icon.Backup,
  },
  signup: {
    title: "Sign up for cross-device syncing!",
    action: () => showSignUpDialog(),
    icon: Icon.Login,
  },
  email: {
    title: "Please confirm your email",
    action: async () => {
      await db.user.sendVerificationEmail();
      showToast("success", "Confirmation email sent. Please check your inbox!");
    },
    icon: Icon.Email,
  },
  recoverykey: {
    title: "Did you backup your recovery key?",
    action: showRecoveryKeyDialog,
    icon: Icon.Warn,
  },
};

export async function resetReminders() {
  appStore.set((state) => (state.reminders = []));
  if (await shouldAddBackupReminder()) {
    appStore.addReminder("backup", "high");
  }
  if (await shouldAddSignupReminder()) {
    appStore.addReminder("signup", "low");
  }
  if (await shouldAddConfirmEmailReminder()) {
    appStore.addReminder("email", "high");
  }
  if (await shouldAddRecoveryKeyBackupReminder()) {
    appStore.addReminder("recoverykey", "high");
  }
}
