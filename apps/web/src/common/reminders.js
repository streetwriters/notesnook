import Config from "../utils/config";
import { createBackup, db } from "./index";
import * as Icon from "../components/icons";
import dayjs from "dayjs";
import { showSignUpDialog } from "../components/dialogs/signupdialog";

export async function shouldAddBackupReminder() {
  const backupReminderOffset = Config.get("backupReminderOffset", 0);
  if (!backupReminderOffset) return false;

  const lastBackupTime = await db.backup.lastBackupTime();
  const offsetToDays =
    backupReminderOffset === 1 ? 1 : backupReminderOffset === 2 ? 7 : 30;
  return dayjs(lastBackupTime).add(offsetToDays, "d").isAfter(dayjs());
}

export async function shouldAddSignupReminder() {
  const user = await db.user.get();
  if (!user) return true;
}

export const Reminders = {
  backup: {
    title: "Back up your data now!",
    action: createBackup,
    icon: Icon.Backup,
  },
  signup: {
    title: "Sign up for cross-device syncing!",
    action: async () => showSignUpDialog(),
    icon: Icon.Login,
  },
};
