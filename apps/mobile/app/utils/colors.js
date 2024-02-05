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
import { useThemeStore } from "../stores/use-theme-store";

export const ColorValues = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#F9D71C",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E"
};

export function getContainerBorder(
  color,
  borderWidth = 0.8,
  colorDepth = 0.05
) {
  return {
    borderWidth: borderWidth,
    borderColor: getColorLinearShade(
      color,
      colorDepth,
      useThemeStore.getState().colorScheme === "dark"
    )
  };
}

export function getColorLinearShade(color, alpha, isDark) {
  return RGB_Linear_Shade(!isDark ? alpha * -1 : alpha, hexToRGBA(color));
}

export function updateStatusBarColor() {
  StatusBar.setBarStyle(
    useThemeStore.getState().colorScheme === "dark"
      ? "light-content"
      : "dark-content",
    true
  );
  if (Platform.OS === "android") {
    StatusBar.setBackgroundColor("transparent", true);
    StatusBar.setTranslucent(true, true);
  }
}

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
