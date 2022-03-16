import React, { useEffect } from "react";
import { useStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import { useStore as useThemeStore } from "./stores/theme-store";
import { useStore as useAttachmentStore } from "./stores/attachment-store";
import { resetReminders } from "./common/reminders";
import { introduceFeatures, showUpgradeReminderDialogs } from "./common";
import { AppEventManager, AppEvents } from "./common/app-events";
import { db } from "./common/db";
import { CHECK_IDS, EV, EVENTS } from "notes-core/common";
import { registerKeyMap } from "./common/key-map";
import { isUserPremium } from "./hooks/use-is-user-premium";
import { loadTrackerScript } from "./utils/analytics";
import useAnnouncements from "./utils/use-announcements";
import {
  showAnnouncementDialog,
  showBuyDialog,
  showInvalidSystemTimeDialog,
  showOnboardingDialog,
} from "./common/dialog-controller";
import useSystemTheme from "./utils/use-system-theme";
import { isTesting } from "./utils/platform";
import { updateStatus, removeStatus, getStatus } from "./hooks/use-status";
import { showToast } from "./utils/toast";
import { interruptedOnboarding } from "./components/dialogs/onboarding-dialog";

if (process.env.NODE_ENV === "production") {
  loadTrackerScript();
  console.log = () => {};
}

export default function AppEffects({ setShow }) {
  const refreshNavItems = useStore((store) => store.refreshNavItems);
  const sync = useStore((store) => store.sync);
  const updateLastSynced = useStore((store) => store.updateLastSynced);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const addReminder = useStore((store) => store.addReminder);
  const initUser = useUserStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const initAttachments = useAttachmentStore((store) => store.init);
  const setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  const setTheme = useThemeStore((store) => store.setTheme);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);
  const [announcements, remove] = useAnnouncements("dialog");
  const isSystemThemeDark = useSystemTheme();

  useEffect(
    function initializeApp() {
      const userCheckStatusEvent = EV.subscribe(
        EVENTS.userCheckStatus,
        async (type) => {
          if (isUserPremium()) {
            return { type, result: true };
          } else {
            if (type !== CHECK_IDS.databaseSync)
              showToast(
                "error",
                "Please upgrade your account to Pro to use this feature.",
                [{ text: "Upgrade now", onClick: () => showBuyDialog() }]
              );
            return { type, result: false };
          }
        }
      );

      EV.subscribe(EVENTS.databaseSyncRequested, async (full, force) => {
        await sync(full, force);
      });

      initAttachments();
      refreshNavItems();
      initNotes();
      (async function () {
        await updateLastSynced();
        if (await initUser()) {
          showUpgradeReminderDialogs();
        }
        await resetReminders();
        setIsVaultCreated(await db.vault.exists());

        showOnboardingDialog(interruptedOnboarding());
      })();
      return () => {
        userCheckStatusEvent.unsubscribe();
      };
    },
    [
      initAttachments,
      sync,
      updateLastSynced,
      refreshNavItems,
      initUser,
      initNotes,
      addReminder,
      setIsVaultCreated,
    ]
  );

  useEffect(() => {
    const systemTimeInvalidEvent = EV.subscribe(
      EVENTS.systemTimeInvalid,
      async ({ serverTime, localTime }) => {
        await showInvalidSystemTimeDialog({ serverTime, localTime });
      }
    );

    const attachmentsLoadingEvent = EV.subscribe(
      EVENTS.attachmentsLoading,
      ({ type, total, current }) => {
        const [key, status] = getProcessingStatusFromType(type);

        if (current === total) {
          removeStatus(key);
        } else {
          updateStatus({
            key,
            status: `${status} attachments (${current}/${total})`,
            progress: 0,
          });
        }
      }
    );

    const progressEvent = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ type, total, loaded }) => {
        const [key, status] = getProcessingStatusFromType(type);
        if (!key) return;

        const percent = Math.round((loaded / total) * 100);
        const text = getStatus(key)?.status || `${status} attachment`;

        if (loaded === total) {
          removeStatus(key);
        } else {
          updateStatus({
            key,
            status: text,
            progress: loaded === total ? 100 : percent,
          });
        }
      }
    );

    registerKeyMap();
    return () => {
      attachmentsLoadingEvent.unsubscribe();
      progressEvent.unsubscribe();
      systemTimeInvalidEvent.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setShow(!isFocusMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    introduceFeatures();
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    if (!announcements.length || isTesting()) return;
    (async () => {
      await showAnnouncementDialog(announcements[0], remove);
    })();
  }, [announcements, remove]);

  useEffect(() => {
    if (!followSystemTheme) return;
    setTheme(isSystemThemeDark ? "dark" : "light");
  }, [isSystemThemeDark, followSystemTheme, setTheme]);

  return <React.Fragment />;
}

function getProcessingStatusFromType(type) {
  switch (type) {
    case "download":
      return ["downloadingAttachments", "Downloading"];
    case "upload":
      return ["uploadingAttachments", "Uploading"];
    case "encrypt":
      return ["encryptingAttachments", "Encrypting"];
    default:
      return undefined;
  }
}
