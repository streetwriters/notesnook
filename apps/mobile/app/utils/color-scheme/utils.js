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

import { Appearance } from "react-native";
import {
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_PITCH_BLACK,
  setAccentColor,
  setColorScheme
} from ".";
import SettingsService from "../../services/settings";

const isValidHex = (hex) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);
const getChunksFromString = (st, chunkSize) =>
  st.match(new RegExp(`.{${chunkSize}}`, "g"));
const convertHexUnitTo256 = (hexStr) =>
  parseInt(hexStr.repeat(2 / hexStr.length), 16);
const getAlphaFloat = (a, alpha) => {
  if (typeof a !== "undefined") {
    return a / 256;
  }
  if (typeof alpha !== "undefined") {
    if (1 < alpha && alpha <= 100) {
      return alpha / 100;
    }
    if (0 <= alpha && alpha <= 1) {
      return alpha;
    }
  }
  return 1;
};
const rgbRes = {
  color: "",
  result: ""
};
export const hexToRGBA = (hex, alpha) => {
  if (rgbRes.color === hex) return rgbRes.result;
  if (!isValidHex(hex)) {
    return hex;
  }
  const chunkSize = Math.floor((hex.length - 1) / 3);
  const hexArr = getChunksFromString(hex.slice(1), chunkSize);
  const [r, g, b, a] = hexArr.map(convertHexUnitTo256);
  return `rgba(${r}, ${g}, ${b}, ${getAlphaFloat(a, alpha)})`;
};
const shadeRes = {
  color: "",
  alpha: 0,
  result: ""
};
export const RGB_Linear_Shade = (p, rgba) => {
  if (shadeRes.color === rgba && shadeRes.alpha === p) return shadeRes.result;
  let i = parseInt,
    r = Math.round,
    P = p < 0,
    t = P ? 0 : 255 * p,
    [a, b, c, d] = rgba.split(",");
  P = P ? 1 + p : 1 - p;
  return (
    "rgb" +
    (d ? "a(" : "(") +
    r(i(a[3] === "a" ? a.slice(5) : a.slice(4)) * P + t) +
    "," +
    r(i(b) * P + t) +
    "," +
    r(i(c) * P + t) +
    (d ? "," + d : ")")
  );
};

export function getColorScheme(overrideSystemTheme) {
  let { pitchBlack, theme, useSystemTheme } = SettingsService.get();
  const darkTheme = pitchBlack ? COLOR_SCHEME_PITCH_BLACK : COLOR_SCHEME_DARK;

  if (useSystemTheme && !overrideSystemTheme) {
    setAccentColor(theme.accent);
    Appearance.getColorScheme() === "dark"
      ? setColorScheme(darkTheme)
      : setColorScheme(COLOR_SCHEME_LIGHT);
    SettingsService.set({
      theme: {
        ...theme,
        dark: Appearance.getColorScheme() === "dark"
      }
    });
    return COLOR_SCHEME;
  }

  setAccentColor(theme.accent);
  setColorScheme(theme.dark ? darkTheme : COLOR_SCHEME_LIGHT);
  return COLOR_SCHEME;
}

export const switchAccentColor = async (color) => {
  setAccentColor(color);
  let settings = SettingsService.get();
  SettingsService.set({
    theme: {
      ...settings.theme,
      accent: color
    }
  });
  getColorScheme();
};

export const toggleDarkMode = async () => {
  let settings = SettingsService.get();
  SettingsService.set({
    theme: {
      ...settings.theme,
      dark: !settings.theme?.dark
    }
  });
  getColorScheme(true);
};
