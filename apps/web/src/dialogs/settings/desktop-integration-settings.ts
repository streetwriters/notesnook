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
import { desktop } from "../../common/desktop-bridge";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { showToast } from "../../utils/toast";
import { SettingsGroup } from "./types";

export const DesktopIntegrationSettings: SettingsGroup[] = [
  {
    key: "desktop-integration",
    section: "desktop",
    header: strings.desktopIntegration(),
    settings: [
      {
        key: "auto-start",
        title: strings.autoStartOnSystemStartup(),
        description: strings.autoStartDescription(),
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
        title: strings.startMinimized(),
        description: strings.startMinimizedDescription(),
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
        title: strings.minimizeToSystemTray(),
        description: strings.minimizeToSystemTrayDescription(),
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
        title: strings.closeToSystemTray(),
        description: strings.closeToSystemTrayDescription(),
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
      },
      {
        key: "use-native-titlebar",
        title: strings.useNativeTitlebar(),
        description: strings.useNativeTitlebarDescription(),
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
                ?.nativeTitlebar,
            toggle: () => {
              useSettingStore.getState().setDesktopIntegration({
                nativeTitlebar:
                  !useSettingStore.getState().desktopIntegrationSettings
                    ?.nativeTitlebar
              });
              showToast("success", strings.restartAppToTakeEffect(), [
                {
                  text: strings.restartNow(),
                  onClick: () => desktop?.integration.restart.query()
                }
              ]);
            }
          }
        ]
      }
    ]
  }
];
