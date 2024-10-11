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

import { SettingsGroup } from "./types";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { strings } from "@notesnook/intl";

export const NotificationsSettings: SettingsGroup[] = [
  {
    key: "reminders",
    section: "notifications",
    header: strings.notifications(),
    settings: [
      {
        key: "reminders",
        title: strings.reminderNotification(),
        description: strings.reminderNotificationDesc(),
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => s.notificationsSettings.reminder,
            listener
          ),
        components: [
          {
            type: "toggle",
            isToggled: () =>
              !!useSettingStore.getState().notificationsSettings.reminder,
            toggle: () =>
              useSettingStore.getState().setNotificationSettings({
                reminder:
                  !useSettingStore.getState().notificationsSettings.reminder
              })
          }
        ]
      }
    ]
  }
];
