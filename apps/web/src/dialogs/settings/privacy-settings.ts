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
import { useStore as useUserStore } from "../../stores/user-store";
import { getPlatform } from "../../utils/platform";
import { db } from "../../common/db";
import Config from "../../utils/config";
import { showToast } from "../../utils/toast";
import { PromptDialog } from "../prompt";
import { strings } from "@notesnook/intl";

export const PrivacySettings: SettingsGroup[] = [
  {
    key: "general",
    section: "privacy",
    header: strings.general(),
    settings: [
      {
        key: "marketing",
        title: strings.marketingEmails(),
        description: strings.marketingEmailsDesc(),
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user?.marketingConsent, listener),
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "toggle",
            isToggled: () => !!useUserStore.getState().user?.marketingConsent,
            toggle: async () => {
              await db.user.changeMarketingConsent(
                !useUserStore.getState().user?.marketingConsent
              );
              await useUserStore.getState().refreshUser();
            }
          }
        ]
      },
      {
        key: "hide-note-title",
        title: strings.hideNoteTitle(),
        description: strings.hideNoteTitleDescription(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.hideNoteTitle, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().hideNoteTitle,
            toggle: () => useSettingStore.getState().toggleHideTitle()
          }
        ]
      },
      {
        key: "privacy-mode",
        title: strings.privacyMode(),
        description: strings.privacyModeDesc(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.privacyMode, listener),
        isHidden: () => !IS_DESKTOP_APP || getPlatform() === "linux",
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().privacyMode,
            toggle: () => useSettingStore.getState().togglePrivacyMode()
          }
        ]
      }
    ]
  },
  {
    key: "advanced",
    section: "privacy",
    header: strings.advanced(),
    settings: [
      {
        key: "custom-dns",
        title: strings.useCustomDns(),
        description: strings.customDnsDescription(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.customDns, listener),
        isHidden: () => !IS_DESKTOP_APP,
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().customDns,
            toggle: () => useSettingStore.getState().toggleCustomDns()
          }
        ]
      },
      {
        key: "custom-cors",
        title: strings.corsBypass(),
        description: strings.corsBypassDesc(),
        components: [
          {
            type: "button",
            title: strings.changeProxy(),
            action: async () => {
              const result = await PromptDialog.show({
                title: strings.corsBypass(),
                description: strings.corsBypassDesc(),
                defaultValue: Config.get(
                  "corsProxy",
                  "https://cors.notesnook.com"
                )
              });
              if (!result) return;
              try {
                const url = new URL(result);
                Config.set("corsProxy", `${url.protocol}//${url.hostname}`);
              } catch (e) {
                console.error(e);
                showToast("error", strings.invalidCors());
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "proxy-config",
        title: strings.proxy(),
        description: strings.proxyDescription(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((c) => c.proxyRules, listener),
        components: [
          {
            type: "input",
            inputType: "text",
            defaultValue: () => useSettingStore.getState().proxyRules || "",
            onChange: (value) => {
              useSettingStore.getState().setProxyRules(value);
            }
          }
        ]
      }
    ]
  }
];
