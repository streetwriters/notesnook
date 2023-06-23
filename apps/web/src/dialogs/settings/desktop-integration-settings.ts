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

export const DesktopIntegrationSettings: SettingsGroup[] = [
  {
    key: "desktop-integration",
    section: "desktop",
    header: "Desktop integration",
    settings: [
      {
        key: "auto-start",
        title: "Auto start on system startup",
        description:
          "If true, Notesnook will automatically start up when you turn on & login to your system.",
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => s.desktopIntegrationSettings,
            listener
          ),
        components: [
          {
            type: "toggle",
            isToggled: () =>
              !!useSettingStore.getState().desktopIntegrationSettings
                ?.autoStart,
            toggle: () => {
              const { setDesktopIntegration, desktopIntegrationSettings } =
                useSettingStore.getState();
              setDesktopIntegration({
                autoStart: !desktopIntegrationSettings?.autoStart
              });
            }
          }
        ]
      },
      {
        key: "start-minimized",
        title: "Start minimized",
        description:
          "If true, Notesnook will start minimized to either the system tray or your system taskbar/dock. This setting only works with Auto start on system startup is enabled.",
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => s.desktopIntegrationSettings,
            listener
          ),
        isHidden: () =>
          !useSettingStore.getState().desktopIntegrationSettings?.autoStart,
        components: [
          {
            type: "toggle",
            isToggled: () =>
              !!useSettingStore.getState().desktopIntegrationSettings
                ?.startMinimized,
            toggle: () =>
              useSettingStore.getState().setDesktopIntegration({
                startMinimized:
                  !useSettingStore.getState().desktopIntegrationSettings
                    ?.startMinimized
              })
          }
        ]
      },
      {
        key: "minimize-to-tray",
        title: "Minimize to system tray",
        description: 'Pressing "—" will hide the app in your system tray.',
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => s.desktopIntegrationSettings,
            listener
          ),
        components: [
          {
            type: "toggle",
            isToggled: () =>
              !!useSettingStore.getState().desktopIntegrationSettings
                ?.minimizeToSystemTray,
            toggle: () =>
              useSettingStore.getState().setDesktopIntegration({
                minimizeToSystemTray:
                  !useSettingStore.getState().desktopIntegrationSettings
                    ?.minimizeToSystemTray
              })
          }
        ]
      },
      {
        key: "close-to-tray",
        title: "Close to system tray",
        description: 'Pressing "X" will hide the app in your system tray.',
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => s.desktopIntegrationSettings,
            listener
          ),
        components: [
          {
            type: "toggle",
            isToggled: () =>
              !!useSettingStore.getState().desktopIntegrationSettings
                ?.closeToSystemTray,
            toggle: () =>
              useSettingStore.getState().setDesktopIntegration({
                closeToSystemTray:
                  !useSettingStore.getState().desktopIntegrationSettings
                    ?.closeToSystemTray
              })
          }
        ]
      }
    ]
  }
];
