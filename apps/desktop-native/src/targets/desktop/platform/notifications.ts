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

import { App } from "@react-native-gpui/core/desktop";
import {
  getPermission,
  onEvent,
  requestPermission,
  show
} from "@react-native-gpui/notifications";
import { environment } from "./environment";
import type { Notifications } from "../../../platform";

export const notifications: Notifications = {
  async isPermissionGranted() {
    return (await getPermission()) === "granted";
  },
  async requestPermission() {
    return (await requestPermission()) === "granted";
  },
  async show(options) {
    const outcome = new Promise<boolean>((resolve) => {
      const subscription = onEvent((event) => {
        if (event.notification.id !== options.tag) return;
        if (event.type === "press" || event.type === "action") {
          subscription.remove();
          resolve(true);
        } else if (event.type === "dismiss") {
          subscription.remove();
          resolve(false);
        }
      });
    });
    await show({
      id: options.tag,
      title: options.title,
      body: options.body,
      silent: options.silent
    });
    if (options.urgency === "critical" && environment.os !== "Linux")
      App.beep().catch(() => {});
    return outcome;
  }
};
