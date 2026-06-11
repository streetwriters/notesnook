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
import { Linking } from "react-native";
import { SettingSection } from "../types";

export const communityGroup: SettingSection = {
  id: "community",
  name: strings.community(),
  sections: [
    {
      id: "join-telegram",
      name: strings.joinTelegram(),
      description: strings.joinTelegramDesc(),
      icon: "telegram-logo",
      iconFamily: "notesnook",
      iconSize: 16,
      modifer: () => {
        Linking.openURL("https://t.me/notesnook").catch(() => {
          /* empty */
        });
      }
    },
    {
      id: "join-mastodon",
      name: strings.joinMastodon(),
      description: strings.joinMastodonDesc(),
      icon: "mastodon-logo",
      iconFamily: "notesnook",
      modifer: () => {
        Linking.openURL("https://fosstodon.org/@notesnook").catch(console.log);
      }
    },
    {
      id: "join-twitter",
      name: strings.followOnX(),
      description: strings.followOnXDesc(),
      icon: "x-logo",
      iconFamily: "notesnook",
      modifer: () => {
        Linking.openURL("https://twitter.com/notesnook").catch(() => {
          /* empty */
        });
      }
    },
    {
      id: "join-discord",
      name: strings.joinDiscord(),
      icon: "discord-logo",
      iconFamily: "notesnook",
      modifer: async () => {
        Linking.openURL("https://discord.gg/zQBK97EE22").catch(() => {
          /* empty */
        });
      },
      description: strings.joinDiscordDesc()
    }
  ]
};
