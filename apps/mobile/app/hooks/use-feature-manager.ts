import { useAreFeaturesAvailable } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useEffect } from "react";
import { db } from "../common/database";
import { presentDialog } from "../components/dialog/functions";
import { useDragState } from "../screens/settings/editor/state";
import { eSendEvent } from "../services/event-manager";
import Navigation from "../services/navigation";
import Notifications from "../services/notifications";
import SettingsService from "../services/settings";
import { useUserStore } from "../stores/use-user-store";
import { eCloseSimpleDialog } from "../utils/events";

export default function useFeatureManager() {
  const features = useAreFeaturesAvailable([
    "appLock",
    "createNoteFromNotificationDrawer",
    "pinNoteInNotification",
    "markdownShortcuts",
    "customHomepage",
    "defaultNotebookAndTag",
    "defaultSidebarTab",
    "customToolbarPreset",
    "disableTrashCleanup",
    "fullOfflineMode"
  ]);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (!user || !features) return;

    if (!features.createNoteFromNotificationDrawer.isAllowed) {
      SettingsService.setProperty("notifNotes", false);
    }

    if (!features.pinNoteInNotification.isAllowed) {
      Notifications.clearPinnedNotes();
    }

    if (!features.markdownShortcuts.isAllowed) {
      SettingsService.setProperty("markdownShortcuts", false);
    }

    if (!features.customHomepage.isAllowed) {
      SettingsService.setProperty("homepageV2", undefined);
    }

    if (!features.defaultSidebarTab.isAllowed) {
      SettingsService.setProperty("defaultSidebarTab", 0);
    }

    if (
      !features.customToolbarPreset.isAllowed &&
      useDragState.getState().preset === "custom"
    ) {
      useDragState.getState().setPreset("default");
    }

    if (!features.fullOfflineMode.isAllowed) {
      SettingsService.setProperty("offlineMode", false);
    }

    if (!features.defaultNotebookAndTag.isAllowed) {
      db.settings.setDefaultNotebook(undefined);
      db.settings.setDefaultTag(undefined);
    }
    const isAppLocked = useUserStore.getState().appLocked;
    let unsub: () => void;

    if (isAppLocked) {
      unsub = useUserStore.subscribe((state) => {
        if (!state.appLocked && !features?.appLock?.isAllowed) {
          unsub();
          SettingsService.setProperty("appLockEnabled", false);
          setTimeout(() => {
            presentDialog({
              title: "App Lock Disabled",
              paragraph: features?.appLock?.error,
              positiveText: strings.upgrade(),
              negativeText: strings.cancel(),
              positivePress: async () => {
                eSendEvent(eCloseSimpleDialog);
                Navigation.navigate("PayWall", {
                  context: "logged-in"
                });
              }
            });
          }, 1000);
        }
      });
    }

    return () => {
      unsub?.();
    };
  }, [features]);

  return true;
}
