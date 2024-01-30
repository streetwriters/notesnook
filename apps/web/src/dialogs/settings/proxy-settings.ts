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

export const ProxySettings: SettingsGroup[] = [
  {
    key: "proxy",
    section: "proxy",
    header: "Proxy",
    settings: [
      {
        key: "proxy-config",
        title: "Proxy Configuration",
        description: `Setup a http/https/socks proxy. For example:

https://foopy:80 - This will set https://foopy as the proxy and 80 as the port. This will use HTTP proxy foopy:80 for all URLs.`,
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
