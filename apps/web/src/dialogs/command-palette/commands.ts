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

import { ArrowTopRight, Plus, Radar } from "../../components/icons";
import { hashNavigate, navigate } from "../../navigation";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { AttachmentsDialog } from "../attachments-dialog";
import { CreateColorDialog } from "../create-color-dialog";

export const commands = [
  {
    id: "next-tab",
    title: "Next tab",
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().openNextSession(),
    group: "Navigate"
  },
  {
    id: "previous-tab",
    title: "Previous tab",
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().openPreviousSession(),
    group: "Navigate"
  },
  {
    id: "notes",
    title: "Notes",
    icon: ArrowTopRight,
    action: () => navigate("/"),
    group: "Navigate"
  },
  {
    id: "notebooks",
    title: "Notebooks",
    icon: ArrowTopRight,
    action: () => navigate("/notebooks"),
    group: "Navigate"
  },
  {
    id: "tags",
    title: "Tags",
    icon: ArrowTopRight,
    action: () => navigate("/tags"),
    group: "Navigate"
  },
  {
    id: "favorites",
    title: "Favorites",
    icon: ArrowTopRight,
    action: () => navigate("/favorites"),
    group: "Navigate"
  },
  {
    id: "reminders",
    title: "Reminders",
    icon: ArrowTopRight,
    action: () => navigate("/reminders"),
    group: "Navigate"
  },
  {
    id: "monographs",
    title: "Monographs",
    icon: ArrowTopRight,
    action: () => navigate("/monographs"),
    group: "Navigate"
  },
  {
    id: "trash",
    title: "Trash",
    icon: ArrowTopRight,
    action: () => navigate("/trash"),
    group: "Navigate"
  },
  {
    id: "settings",
    title: "Settings",
    icon: ArrowTopRight,
    action: () => hashNavigate("/settings", { replace: true }),
    group: "Navigate"
  },
  {
    id: "help",
    title: "Help",
    icon: ArrowTopRight,
    action: () => (window.location.href = "https://help.notesnook.com"),
    group: "Navigate"
  },
  {
    id: "attachment-manager",
    title: "Attachment manager",
    icon: ArrowTopRight,
    action: () => AttachmentsDialog.show({}),
    group: "Navigate"
  },
  {
    id: "new-note",
    title: "New note",
    icon: Plus,
    action: () => useEditorStore.getState().newSession(),
    group: "Create"
  },
  {
    id: "new-notebook",
    title: "New notebook",
    icon: Plus,
    action: () => hashNavigate("/notebooks/create", { replace: true }),
    group: "Create"
  },
  {
    id: "new-tag",
    title: "New tag",
    icon: Plus,
    action: () => hashNavigate("/tags/create", { replace: true }),
    group: "Create"
  },
  {
    id: "new-reminder",
    title: "New reminder",
    icon: Plus,
    action: () => hashNavigate(`/reminders/create`, { replace: true }),
    group: "Create"
  },
  {
    id: "new-color",
    title: "New color",
    icon: Plus,
    action: () => CreateColorDialog.show(true),
    group: "Create"
  },
  {
    id: "close-tab",
    title: "Close current tab",
    icon: Radar,
    action: () =>
      useEditorStore.getState().activeSessionId
        ? useEditorStore
            .getState()
            .closeSessions(useEditorStore.getState().activeSessionId!)
        : () => {},
    group: "General"
  },
  {
    id: "toggle-theme",
    title: "Toggle theme",
    icon: Radar,
    action: () => useThemeStore.getState().toggleColorScheme(),
    group: "General"
  }
];
