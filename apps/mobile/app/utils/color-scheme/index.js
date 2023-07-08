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
import { eSendEvent } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { eThemeUpdated } from "../events";
import { NotesnookModule } from "../notesnook-module";

export const ACCENT = {
  color: "#008837",
  shade: "#00883712"
};

export const COLORS_NOTE = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#F9D71C",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E"
};

const fixedColors = {
  accent: ACCENT.color,
  shade: ACCENT.shade,
  fg: ACCENT.color,
  normal: "black",
  icon: "gray",
  transGray: "#00000010",
  errorBg: "#f4433620",
  errorText: "#ff6961",
  successBg: "#DFF2BF",
  successText: "#4F8A10",
  warningBg: "#FF990020",
  warningText: "#FF9900",
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#FFD600",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E",
  discord: "#5865F2"
};
export var COLOR_SCHEME = {
  ...fixedColors,
  night: false,
  bg: "#ffffff",
  navbg: "#f7f7f7",
  nav: "#f7f7f7",
  input: "transparent",
  heading: "#212121",
  pri: "#505050",
  sec: "#ffffff",
  light: "#ffffff",
  transGray: "#00000010",
  border: "#E8E8E8",
  placeholder: "#a9a9a9"
};

export const COLOR_SCHEME_LIGHT = {
  ...fixedColors,
  night: false,
  bg: "#ffffff",
  navbg: "#f7f7f7",
  nav: "#f7f7f7",
  input: "transparent",
  heading: "#212121",
  pri: "#505050",
  sec: "#ffffff",
  light: "#ffffff",
  transGray: "#00000010",
  border: "#E8E8E8",
  placeholder: "#b6b6b6"
};
export const COLOR_SCHEME_PITCH_BLACK = {
  ...fixedColors,
  night: true,
  bg: "#000000",
  navbg: "#2b2b2b",
  input: "#2d2d2d",
  nav: "#1a1a1a",
  heading: "#E8E8E8",
  pri: "#C0C0C0",
  sec: "black",
  light: "#ffffff",
  transGray: "#ffffff10",
  border: "#383838",
  placeholder: "#606060"
};

export const COLOR_SCHEME_DARK = {
  ...fixedColors,
  night: true,
  bg: "#1f1f1f",
  navbg: "#2b2b2b",
  input: "#2d2d2d",
  nav: "#2b2b2b",
  heading: "#E8E8E8",
  pri: "#C0C0C0",
  sec: "black",
  light: "#ffffff",
  transGray: "#ffffff10",
  border: "#383838",
  placeholder: "#404040"
};

export function getCurrentColors() {
  return COLOR_SCHEME;
}

export function setColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
  COLOR_SCHEME = { ...colors, accent: accent.color, shade: accent.shade };

  useThemeStore.getState().setColors({ ...COLOR_SCHEME });

  StatusBar.setBarStyle(
    COLOR_SCHEME.night ? "light-content" : "dark-content",
    false
  );
  if (Platform.OS === "android") {
    NotesnookModule.setBackgroundColor(COLOR_SCHEME.bg);
    StatusBar.setBackgroundColor("transparent", false);
    StatusBar.setTranslucent(true, false);
  }
  eSendEvent(eThemeUpdated);

  return COLOR_SCHEME;
}

export function setAccentColor(color) {
  ACCENT.color = color;
  ACCENT.shade = color + "12";

  return ACCENT;
}

export function updateStatusBarColor() {
  StatusBar.setBarStyle(
    COLOR_SCHEME.night ? "light-content" : "dark-content",
    true
  );
  if (Platform.OS === "android") {
    StatusBar.setBackgroundColor("transparent", true);
    StatusBar.setTranslucent(true, true);
  }
}
