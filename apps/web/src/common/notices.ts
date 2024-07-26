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
import { createBackup, verifyAccount } from "./index";
import { db } from "./db";
import { store as appStore } from "../stores/app-store";
import { Backup, User, Email, Warn, Icon } from "../components/icons";
import dayjs from "dayjs";
import { hardNavigate, hashNavigate } from "../navigation";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { showToast } from "../utils/toast";
import { TaskScheduler } from "../utils/task-scheduler";
import { BuyDialog } from "../dialogs/buy-dialog";
import { RecoveryKeyDialog } from "../dialogs/recovery-key-dialog";

export type NoticeType = "autoBackupsOff" | "login" | "email" | "recoverykey";

export type Notice = {
  type: NoticeType;
  priority: number;
  params?: any;
};

export const BACKUP_CRON_EXPRESSIONS = {
  0: "",
  1: "0 0 8 * * *", // daily at 8 AM
  2: "0 0 8 * * 1", // Every monday at 8 AM
  3: "0 0 0 1 * *" // 1st day of every month
};

export const FULL_BACKUP_CRON_EXPRESSIONS = {
  0: "",
  1: "0 0 8 * * 1", // Every monday at 8 AM
  2: "0 0 0 1 * *" // 1st day of every month
};

export async function scheduleBackups() {
  const backupInterval = Config.get("backupReminderOffset", 0);

  await TaskScheduler.stop("automatic-backups");
  if (!backupInterval) return false;

  console.log("Scheduling automatic backups");
  await TaskScheduler.register(
    "automatic-backups",
    BACKUP_CRON_EXPRESSIONS[backupInterval],
    () => {
      console.log("Backing up automatically");
      saveBackup();
    }
  );
}

export async function scheduleFullBackups() {
  const backupInterval = Config.get("fullBackupReminderOffset", 0);

  await TaskScheduler.stop("automatic-full-backups");
  if (!backupInterval) return false;

  console.log("Scheduling automatic full backups");
  await TaskScheduler.register(
    "automatic-full-backups",
    FULL_BACKUP_CRON_EXPRESSIONS[backupInterval],
    () => {
      console.log("Backing up automatically");
      saveBackup("full");
    }
  );
}

export function shouldAddAutoBackupsDisabledNotice() {
  const backupInterval = Config.get("backupReminderOffset", 0);
  if (!isUserPremium() && backupInterval) {
    Config.set("backupReminderOffset", 0);
    return true;
  }

  return false;
}

export async function shouldAddBackupNotice() {
  const backupInterval = Config.get("backupReminderOffset", 0);
  if (!backupInterval) return false;

  const lastBackupTime = await db.backup.lastBackupTime();
  if (!lastBackupTime) {
    await db.backup.updateBackupTime();
    return false;
  }

  const offsetToDays = backupInterval === 1 ? 1 : backupInterval === 2 ? 7 : 30;

  return dayjs(lastBackupTime).add(offsetToDays, "d").isBefore(dayjs());
}

export async function shouldAddRecoveryKeyBackupNotice() {
  if (isIgnored("recoverykey")) return false;

  const recoveryKeyBackupDate = Config.get("recoveryKeyBackupDate", 0);
  if (!recoveryKeyBackupDate) return true;
  return dayjs(recoveryKeyBackupDate).add(30, "d").isBefore(dayjs());
}

export async function shouldAddLoginNotice() {
  const user = await db.user.getUser();
  if (!user) return true;
}

export async function shouldAddConfirmEmailNotice() {
  const user = await db.user.getUser();
  return !user?.isEmailConfirmed;
}

type NoticeData = {
  key: string;
  title: string;
  subtitle: string;
  action: (params?: any) => void;
  dismissable?: boolean;
  icon: Icon;
};

export const NoticesData: Record<NoticeType, NoticeData> = {
  autoBackupsOff: {
    key: "autoBackupsOff",
    title: "Automatic backups disabled",
    subtitle: "Please upgrade to Pro to enable automatic backups.",
    action: () => BuyDialog.show({}),
    dismissable: true,
    icon: Backup
  },
  login: {
    key: "login",
    title: "Login to sync your notes",
    subtitle: "You are not logged in",
    action: () => hardNavigate("/login"),
    icon: User
  },
  email: {
    key: "email",
    title: "Your email is not confirmed",
    subtitle: "Please confirm your email to sync your notes",
    action: () => hashNavigate("/email/verify"),
    icon: Email
  },
  recoverykey: {
    key: "recoverykey",
    title: "Backup your recovery key",
    subtitle: "Keep your recovery key safe",
    dismissable: true,
    action: async () => {
      if (await verifyAccount()) await RecoveryKeyDialog.show({});
    },
    icon: Warn
  }
};

export async function resetNotices() {
  const notices: Notice[] = [];

  if (shouldAddAutoBackupsDisabledNotice()) {
    notices.push({ type: "autoBackupsOff", priority: 3 });
  }
  if (await shouldAddBackupNotice()) {
    await saveBackup();
  }
  if (await shouldAddLoginNotice()) {
    notices.push({ type: "login", priority: 1 });
  }
  if (await shouldAddConfirmEmailNotice()) {
    notices.push({ type: "email", priority: 4 });
  }
  if (await shouldAddRecoveryKeyBackupNotice()) {
    notices.push({ type: "recoverykey", priority: 5 });
  }
  appStore.get().setNotices(...notices);
}

function isIgnored(key: keyof typeof NoticesData) {
  return Config.get(`ignored:${key}`, false);
}

let openedToast: { hide: () => void } | null = null;
async function saveBackup(mode: "full" | "partial" = "partial") {
  if (IS_DESKTOP_APP) {
    await createBackup({ noVerify: true, mode });
  } else if (isUserPremium() && !IS_TESTING) {
    if (openedToast !== null) return;
    openedToast = showToast(
      "success",
      "Your backup is ready for download.",
      [
        {
          text: "Later",
          onClick: async () => {
            await db.backup.updateBackupTime();
            openedToast?.hide();
            openedToast = null;
          },
          type: "paragraph"
        },
        {
          text: "Download",
          onClick: async () => {
            await createBackup({ mode });
            openedToast?.hide();
            openedToast = null;
          },
          type: "accent"
        }
      ],
      0
    );
  }
}
