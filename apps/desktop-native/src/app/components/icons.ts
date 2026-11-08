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

import { createElement, type ComponentType } from "react";
import {
  mdiAccountOutline,
  mdiAlertCircleOutline,
  mdiAlertOutline,
  mdiArchiveOutline,
  mdiArrowTopRightThick,
  mdiBellPlusOutline,
  mdiBookOutline,
  mdiCalendarOutline,
  mdiCheckCircleOutline,
  mdiChevronDown,
  mdiCircle,
  mdiCloudSyncOutline,
  mdiCogOutline,
  mdiEmailOutline,
  mdiHomeOutline,
  mdiInformationOutline,
  mdiLockOutline,
  mdiMagnify,
  mdiNotebookOutline,
  mdiPlus,
  mdiPoundBox,
  mdiStarOutline,
  mdiSync,
  mdiSyncOff,
  mdiTrashCanOutline,
  mdiUpdate,
  mdiBellOutline,
  mdiTagOutline,
  mdiBackupRestore,
  mdiNoteTextOutline,
  mdiTune,
  mdiDotsHorizontal,
  mdiDockLeft,
  mdiArrowLeft,
  mdiArrowRight,
  mdiClose,
  mdiAppleKeyboardCommand,
  mdiDotsVertical,
  mdiFileDocumentOutline,
  mdiPinOutline,
  mdiPageLayoutSidebarLeft
} from "@mdi/js";
import { Icon as UIIcon, type IconProps } from "@ui";

export type Icon = ComponentType<Omit<IconProps, "path" | "svg">>;

function icon(path: string): Icon {
  const Component: Icon = (props) => createElement(UIIcon, { ...props, path });
  return Component;
}

export const ArrowTopRight = icon(mdiArrowTopRightThick);
export const Backup = icon(mdiBackupRestore);
export const BellPlus = icon(mdiBellPlusOutline);
export const Bell = icon(mdiBellOutline);
export const Email = icon(mdiEmailOutline);
export const Error = icon(mdiAlertCircleOutline);
export const House = icon(mdiHomeOutline);
export const Info = icon(mdiInformationOutline);
export const Plus = icon(mdiPlus);
export const Success = icon(mdiCheckCircleOutline);
export const User = icon(mdiAccountOutline);
export const Warn = icon(mdiAlertOutline);
export const Alert = icon(mdiAlertOutline);
export const Archive = icon(mdiArchiveOutline);
export const Calendar = icon(mdiCalendarOutline);
export const ChevronDown = icon(mdiChevronDown);
export const Circle = icon(mdiCircle);
export const Cloud = icon(mdiCloudSyncOutline);
export const Lock = icon(mdiLockOutline);
export const Note = icon(mdiNoteTextOutline);
export const Notebook = icon(mdiNotebookOutline);
export const Reminder = icon(mdiUpdate);
export const Search = icon(mdiMagnify);
export const Settings = icon(mdiCogOutline);
export const Star = icon(mdiStarOutline);
export const Sync = icon(mdiSync);
export const SyncOff = icon(mdiSyncOff);
export const Tag = icon(mdiTagOutline);
export const Tags = icon(mdiPoundBox);
export const Trash = icon(mdiTrashCanOutline);
export const Book = icon(mdiBookOutline);
export const Home = icon(mdiHomeOutline);
export const Sliders = icon(mdiTune);
export const More = icon(mdiDotsHorizontal);
export const LeftPanelClose = icon(mdiDockLeft);
export const LeftPanelOpen = icon(mdiPageLayoutSidebarLeft);
export const ArrowLeft = icon(mdiArrowLeft);
export const ArrowRight = icon(mdiArrowRight);
export const Close = icon(mdiClose);
export const Command = icon(mdiAppleKeyboardCommand);
export const DotsVertical = icon(mdiDotsVertical);
export const FileText = icon(mdiFileDocumentOutline);
export const PushPin = icon(mdiPinOutline);
