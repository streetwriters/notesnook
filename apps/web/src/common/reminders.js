import Config from "../utils/config";
import { db } from "./index";
import * as Icon from "../components/icons";
import dayjs from "dayjs";
import { showSignUpDialog } from "../components/dialogs/signupdialog";
import download from "../utils/download";

export async function shouldAddBackupReminder() {
  const backupReminderOffset = Config.get("backupReminderOffset", 0);
  if (backupReminderOffset) return false;

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
    action: {
      text: "Click here to backup!",
      onClick: async () => {
        download(
          `notesnook-backup-${new Date().toLocaleString("en")}`,
          await db.backup.export(),
          "nnbackup"
        );
      },
    },
    icon: Icon.Backup,
  },
  signup: {
    title: "Sign up for cross-device syncing and so much more!",
    action: {
      text: "Click here to sign up!",
      onClick: () => showSignUpDialog(),
    },
    icon: Icon.User,
  },
};
