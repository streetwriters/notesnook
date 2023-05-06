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

import { Platform, StatusBar } from "react-native";

export const COLORS_NOTE = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#F9D71C",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E"
};

export function updateStatusBarColor(isDark) {
  StatusBar.setBarStyle(isDark ? "light-content" : "dark-content", true);
  if (Platform.OS === "android") {
    StatusBar.setBackgroundColor("transparent", true);
    StatusBar.setTranslucent(true, true);
  }
}
