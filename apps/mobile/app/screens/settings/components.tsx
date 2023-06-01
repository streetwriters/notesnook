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
import { AccentColorPicker, HomagePageSelector } from "./appearance";
import { AutomaticBackupsSelector } from "./backup-restore";
import DebugLogs from "./debug";
import { ConfigureToolbar } from "./editor/configure-toolbar";
import { Licenses } from "./licenses";
import SoundPicker from "./sound-picker";
import { Subscription } from "./subscription";
import { TrashIntervalSelector } from "./trash-interval-selector";
import { FontSelector } from "./font-selector";
import { TitleFormat } from "./title-format";
import { DateFormatSelector, TimeFormatSelector } from "./date-format";
export const components: { [name: string]: ReactElement } = {
  colorpicker: <AccentColorPicker />,
  homeselector: <HomagePageSelector />,
  autobackups: <AutomaticBackupsSelector />,
  subscription: <Subscription />,
  configuretoolbar: <ConfigureToolbar />,
  "debug-logs": <DebugLogs />,
  "sound-picker": <SoundPicker />,
  licenses: <Licenses />,
  "trash-interval-selector": <TrashIntervalSelector />,
  "font-selector": <FontSelector />,
  "title-format": <TitleFormat />,
  "date-format-selector": <DateFormatSelector />,
  "time-format-selector": <TimeFormatSelector />
};
