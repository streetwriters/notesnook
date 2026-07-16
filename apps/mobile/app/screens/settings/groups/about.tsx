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
import React from "react";
import { Linking } from "react-native";
import { getVersion } from "react-native-device-info";
import { Update } from "../../../components/sheets/update";
import { presentSheet } from "../../../services/event-manager";
import { SettingSection } from "../types";

export const aboutGroup: SettingSection = {
  id: "about",
  name: strings.about(),
  sections: [
    {
      id: "download",
      name: strings.downloadOnDesktop(),
      icon: "download-simple",
      iconFamily: "notesnook",
      modifer: async () => {
        try {
          await Linking.openURL("https://notesnook.com/downloads");
        } catch (e) {
          console.error(e);
        }
      },
      description: strings.downloadOnDesktopDesc()
    },
    {
      id: "roadmap",
      name: strings.roadmap(),
      icon: "chart-line-up",
      iconFamily: "notesnook",
      modifer: async () => {
        try {
          await Linking.openURL("https://notesnook.com/roadmap/");
        } catch (e) {
          console.error(e);
        }
      },
      description: strings.roadmapDesc()
    },
    {
      id: "check-for-updates",
      name: strings.checkForUpdates(),
      icon: "device-mobile-camera",
      iconFamily: "notesnook",
      description: strings.checkForUpdatesDesc(),
      isModal: true,
      modifer: async () => {
        presentSheet({
          //@ts-ignore // Migrate to ts
          component: (ref) => <Update fwdRef={ref} />
        });
      }
    },
    {
      id: "app-version",
      name: strings.appVersion(),
      icon: "github-logo",
      iconFamily: "notesnook",
      modifer: async () => {
        try {
          await Linking.openURL("https://notesnook.com");
        } catch (e) {
          console.error(e);
        }
      },
      description: getVersion()
    }
  ]
};
