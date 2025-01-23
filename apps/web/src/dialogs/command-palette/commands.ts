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
import { CreateColorDialog } from "../create-color-dialog";

export const commands = [
  {
    title: "Go to next tab",
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().openNextSession(),
    group: "Navigate"
  },
  {
    title: "Go to previous tab",
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().openPreviousSession(),
    group: "Navigate"
  },
  {
    title: "Go to notes",
    icon: ArrowTopRight,
    action: () => navigate("/"),
    group: "Navigate"
  },
  {
    title: "Go to notebooks",
    icon: ArrowTopRight,
    action: () => navigate("/notebooks"),
    group: "Navigate"
  },
  {
    title: "Go to tags",
    icon: ArrowTopRight,
    action: () => navigate("/tags"),
    group: "Navigate"
  },
  {
    title: "Go to favorites",
    icon: ArrowTopRight,
    action: () => navigate("/favorites"),
    group: "Navigate"
  },
  {
    title: "Go to reminders",
    icon: ArrowTopRight,
    action: () => navigate("/reminders"),
    group: "Navigate"
  },
  {
    title: "Go to monographs",
    icon: ArrowTopRight,
    action: () => navigate("/monographs"),
    group: "Navigate"
  },
  {
    title: "Go to trash",
    icon: ArrowTopRight,
    action: () => navigate("/trash"),
    group: "Navigate"
  },
  {
    title: "Go to settings",
    icon: ArrowTopRight,
    action: () => hashNavigate("/settings", { replace: true }),

    group: "Navigate"
  },
  {
    title: "Go to help",
    icon: ArrowTopRight,
    action: () => (window.location.href = "https://help.notesnook.com"),
    group: "Navigate"
  },
  {
    title: "New note",
    icon: Plus,
    action: () => useEditorStore.getState().newSession(),
    group: "Create"
  },
  {
    title: "New notebook",
    icon: Plus,
    action: () => hashNavigate("/notebooks/create", { replace: true }),
    group: "Create"
  },
  {
    title: "New tag",
    icon: Plus,
    action: () => hashNavigate("/tags/create", { replace: true }),
    group: "Create"
  },
  {
    title: "New reminder",
    icon: Plus,
    action: () => hashNavigate(`/reminders/create`, { replace: true }),
    group: "Create"
  },
  {
    title: "New color",
    icon: Plus,
    action: () => CreateColorDialog.show(true),
    group: "Create"
  },
  {
    title: "Toggle theme",
    icon: Radar,
    action: () => useThemeStore.getState().toggleColorScheme(),
    group: "General"
  }
];
