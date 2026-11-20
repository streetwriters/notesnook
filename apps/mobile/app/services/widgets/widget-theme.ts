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
import { getThemeScope, ThemeDefinition } from "@notesnook/theme";
import { useThemeStore } from "../../stores/use-theme-store";
import { IOSWidgets } from "./ios-widgets";

const accentOf = (theme?: ThemeDefinition) =>
  theme ? getThemeScope("base", theme).colors.primary.accent : undefined;

let published = "";
let watching = false;

function publish() {
  const { lightTheme, darkTheme } = useThemeStore.getState();
  const palette = { light: accentOf(lightTheme), dark: accentOf(darkTheme) };
  const serialized = JSON.stringify(palette);
  if (serialized === published) return;
  published = serialized;
  IOSWidgets.publish("theme", palette, [
    "NotesWidget",
    "NotesListWidget",
    "RemindersWidget",
    "NotePreviewWidget"
  ]);
}

export const WidgetTheme = {
  watch() {
    if (!IOSWidgets.isSupported || watching) return;
    watching = true;
    publish();
    useThemeStore.subscribe(publish);
  }
};
