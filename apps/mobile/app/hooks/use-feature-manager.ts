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
import { useAreFeaturesAvailable } from "@notesnook/common";
import { useEffect } from "react";
import { db } from "../common/database";
import { useDragState } from "../screens/settings/editor/state";
import Notifications from "../services/notifications";
import SettingsService from "../services/settings";
import { useUserStore } from "../stores/use-user-store";

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
  }, [features, plan, user]);

  return true;
}
