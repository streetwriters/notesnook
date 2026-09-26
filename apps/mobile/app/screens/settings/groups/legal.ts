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

export const legalGroup: SettingSection = {
  id: "legal",
  name: strings.legal(),
  sections: [
    {
      id: "tos",
      name: strings.tos(),
      icon: "bag-simple",
      iconFamily: "notesnook",
      modifer: async () => {
        try {
          await Linking.openURL("https://notesnook.com/tos");
        } catch (e) {
          console.error(e);
        }
      },
      description: strings.tosDesc()
    },
    {
      id: "privacy-policy",
      name: strings.privacyPolicy(),
      icon: "shield",
      iconFamily: "notesnook",
      modifer: async () => {
        try {
          await Linking.openURL("https://notesnook.com/privacy");
        } catch (e) {
          console.error(e);
        }
      },
      description: strings.privacyPolicyDesc()
    },
    {
      id: "licenses",
      name: strings.licenses(),
      type: "screen",
      component: "licenses",
      description: strings.ossLibs(),
      icon: "file-dashed",
      iconFamily: "notesnook",
      headerBottomBorder: true
    }
  ]
};
