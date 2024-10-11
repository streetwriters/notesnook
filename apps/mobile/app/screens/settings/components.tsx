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

import React, { ReactElement } from "react";
import { AttachmentDialog } from "../../components/attachments";
import { AccentColorPicker } from "./appearance";
import DebugLogs from "./debug";
import { ConfigureToolbar } from "./editor/configure-toolbar";
import { Licenses } from "./licenses";
import { AttachmentGroupProgress } from "./attachment-group-progress";
import {
  ApplockTimerPicker,
  BackupReminderPicker,
  BackupWithAttachmentsReminderPicker,
  DateFormatPicker,
  FontPicker,
  HomePicker,
  TimeFormatPicker,
  TrashIntervalPicker
} from "./picker/pickers";
import { RestoreBackup } from "./restore-backup";
import { ServersConfiguration } from "./server-config";
import SoundPicker from "./sound-picker";
import { Subscription } from "./subscription";
import ThemeSelector from "./theme-selector";
import { TitleFormat } from "./title-format";
import { View } from "react-native";

export const components: { [name: string]: ReactElement } = {
  colorpicker: <AccentColorPicker />,
  homeselector: <HomePicker />,
  autobackups: <BackupReminderPicker />,
  subscription: <Subscription />,
  configuretoolbar: <ConfigureToolbar />,
  "debug-logs": <DebugLogs />,
  "sound-picker": <SoundPicker />,
  licenses: <Licenses />,
  "trash-interval-selector": <TrashIntervalPicker />,
  "font-selector": <FontPicker />,
  "title-format": <TitleFormat />,
  "date-format-selector": <DateFormatPicker />,
  "time-format-selector": <TimeFormatPicker />,
  "theme-selector": <ThemeSelector />,
  "applock-timer": <ApplockTimerPicker />,
  autobackupsattachments: <BackupWithAttachmentsReminderPicker />,
  backuprestore: <RestoreBackup />,
  "server-config": <ServersConfiguration />,
  "attachments-manager": <AttachmentDialog note={undefined} isSheet={false} />,
  "offline-mode-progress": (
    <View style={{ paddingHorizontal: 12 }}>
      <AttachmentGroupProgress groupId="offline-mode" />
    </View>
  )
};
