import { strings } from "@notesnook/intl";
import { presentDialog } from "../../components/dialog/functions";
import { DatabaseLogger, db } from "../../common/database";
import { eSendEvent, ToastManager } from "../../services/event-manager";
import { eCloseSimpleDialog } from "../../utils/events";
import {
  endProgress,
  startProgress,
  updateProgress
} from "../../components/dialogs/progress";
import Navigation from "../../services/navigation";
import BackupService from "../../services/backup";

export async function logoutUser() {
  const hasUnsyncedChanges = await db.hasUnsyncedChanges();
  presentDialog({
    title: strings.logout(),
    paragraph: strings.logoutConfirmation(),
    positiveText: strings.logout(),
    check: {
      info: strings.backupDataBeforeLogout(),
      defaultValue: true
    },
    notice: hasUnsyncedChanges
      ? {
          text: strings.unsyncedChangesWarning(),
          type: "alert"
        }
      : undefined,
    positivePress: async (_, takeBackup) => {
      eSendEvent(eCloseSimpleDialog);
      setTimeout(async () => {
        try {
          startProgress({
            fillBackground: true,
            title: strings.loggingOut(),
            canHideProgress: true,
            paragraph: strings.loggingOutDesc()
          });

          Navigation.navigate("Notes");

          if (takeBackup) {
            updateProgress({
              progress: strings.backingUpData()
            });

            try {
              const result = await BackupService.run(false, "local", "partial");
              if (result?.error) throw result.error as Error;
            } catch (e) {
              DatabaseLogger.error(e);
              const error = e;
              const canLogout = await new Promise((resolve) => {
                presentDialog({
                  context: "local",
                  title: strings.failedToTakeBackup(),
                  paragraph: `${
                    (error as Error).message
                  }. ${strings.failedToTakeBackupMessage()}?`,
                  positiveText: strings.yes(),
                  negativeText: strings.no(),
                  positivePress: () => {
                    resolve(true);
                  },
                  onClose: () => {
                    resolve(false);
                  }
                });
              });
              if (!canLogout) {
                endProgress();
                return;
              }
            }
          }

          updateProgress({
            progress: strings.loggingOut()
          });

          await db.user?.logout();
          endProgress();
        } catch (e) {
          DatabaseLogger.error(e);
          ToastManager.error(e as Error, strings.logoutError());
          endProgress();
        }
      }, 300);
    }
  });
}
