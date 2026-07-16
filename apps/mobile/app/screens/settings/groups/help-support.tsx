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
import Clipboard from "@react-native-clipboard/clipboard";
import React from "react";
import { Linking } from "react-native";
import DownloadLogs from "../../../components/sheets/download-logs";
import { Issue } from "../../../components/sheets/github/issue";
import { ToastManager, presentSheet } from "../../../services/event-manager";
import { SettingSection } from "../types";
export const helpSupportGroup: SettingSection = {
  id: "help-support",
  name: strings.helpAndSupport(),
  sections: [
    {
      id: "report-issue",
      name: strings.reportAnIssue(),
      icon: "warning-circle",
      iconFamily: "notesnook",
      isModal: true,
      modifer: () => {
        presentSheet({
          component: <Issue />
        });
      },
      description: strings.reportAnIssueDesc()
    },
    {
      id: "email-support",
      name: strings.emailSupport(),
      icon: "envelope-simple",
      iconFamily: "notesnook",
      modifer: () => {
        Clipboard.setString("support@streetwriters.co");
        ToastManager.show({
          heading: strings.emailCopied(),
          type: "success",
          icon: "content-copy"
        });
        setTimeout(() => {
          Linking.openURL("mailto:support@streetwriters.co");
        }, 1000);
      },
      description: strings.emailSupportDesc()
    },
    {
      id: "docs-link",
      name: strings.documentation(),
      modifer: async () => {
        Linking.openURL("https://help.notesnook.com/");
      },
      description: strings.documentationDesc(),
      icon: "file-text",
      iconFamily: "notesnook"
    },
    {
      id: "debugging",
      name: strings.downloadDebugLogs(),
      description: strings.downloadDebugLogsDesc(),
      icon: "bug-droid",
      iconFamily: "notesnook",
      isModal: true,
      modifer: () => {
        DownloadLogs.present();
      }
    }
  ]
};
