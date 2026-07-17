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

import { strings } from "@notesnook/intl";
import notifee from "@notifee/react-native";
import { Platform } from "react-native";
import { validators } from "../../../components/ui/input/form-input";
import Notifications from "../../../services/notifications";
import SettingsService from "../../../services/settings";
import { SettingSection } from "../types";

export const productivityGroup: SettingSection = {
  id: "productivity",
  name: strings.productivity(),
  sections: [
    {
      id: "notification-notes",
      type: "switch",
      name: strings.quickNoteNotification(),
      description: strings.quickNoteNotificationDesc(),
      property: "notifNotes",
      icon: "notification",
      iconFamily: "notesnook",
      modifer: async () => {
        const settings = SettingsService.get();
        if (settings.notifNotes) {
          Notifications.unpinQuickNote();
        } else {
          Notifications.pinQuickNote();
        }
        SettingsService.set({
          notifNotes: !settings.notifNotes
        });
      },
      hidden: () => Platform.OS !== "android",
      featureId: "createNoteFromNotificationDrawer"
    },
    {
      id: "reminders",
      type: "screen",
      name: strings.reminders(),
      icon: "bell",
      iconFamily: "notesnook",
      description: strings.remindersDesc(),
      sections: [
        {
          id: "reminder-notifications",
          type: "group",
          name: strings.notifications(),
          sections: [
            {
              id: "enable-reminders",
              property: "reminderNotifications",
              type: "switch",
              name: strings.reminderNotification(),
              icon: "bell-outline",
              onChange: (property) => {
                if (property) {
                  Notifications.setupReminders();
                } else {
                  Notifications.clearAllTriggers();
                }
              },
              description: strings.reminderNotificationDesc()
            },
            {
              id: "snooze-time",
              property: "defaultSnoozeTime",
              type: "input",
              icon: "bell-z",
              iconFamily: "notesnook",
              name: strings.defaultSnoozeTime(),
              description: strings.defaultSnoozeTimeDesc(),
              validators: [
                validators.number(),
                validators.custom((value) => {
                  return value < 5
                    ? strings.valueMustBeGreaterThan("5")
                    : undefined;
                })
              ],
              inputProperties: {
                keyboardType: "decimal-pad",
                defaultValue: 5 + "",
                placeholder: strings.setSnoozeTimePlaceholder(),
                onSubmitEditing: () => {
                  Notifications.setupReminders();
                }
              }
            },
            {
              id: "reminder-sound-ios",
              type: "screen",
              name: strings.changeNotificationSound(),
              description: strings.changeNotificationSoundDesc(),
              component: "sound-picker",
              icon: "speaker-high",
              iconFamily: "notesnook",
              hidden: () =>
                Platform.OS === "ios" ||
                (Platform.OS === "android" && Platform.Version > 25)
            },
            {
              id: "reminder-sound-android",
              name: strings.changeNotificationSound(),
              description: strings.changeNotificationSoundDesc(),
              icon: "speaker-high",
              iconFamily: "notesnook",
              hidden: () =>
                Platform.OS === "ios" ||
                (Platform.OS === "android" && Platform.Version < 26),
              modifer: async () => {
                const id = await Notifications.getChannelId("urgent");
                if (id) {
                  await notifee.openNotificationSettings(id);
                }
              }
            }
          ]
        }
      ]
    }
  ]
};
