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
  const plan = useUserStore((state) => state.user?.subscription?.plan);

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
      if (db.settings.getDefaultNotebook()) {
        db.settings.setDefaultNotebook(undefined);
      }
      if (db.settings.getDefaultTag()) {
        db.settings.setDefaultTag(undefined);
      }
    }
  }, [features, plan]);

  return true;
}
