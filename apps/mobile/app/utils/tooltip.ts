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
import { Platform } from "react-native";

export const POSITIONS = {
  LEFT: 1,
  RIGHT: 2,
  TOP: 3,
  BOTTOM: 4
};
let RNTooltips: any;
let prevTarget: any = null;
function show(event: any, text: string, position = 2) {
  const fluidTabsRef = require("./global-refs").fluidTabsRef;
  if (!RNTooltips) {
    RNTooltips = require("react-native-tooltips").default;
  }
  if (!event._targetInst?.ref?.current) return;
  prevTarget && RNTooltips.Dismiss(prevTarget);
  prevTarget = null;
  prevTarget = event._targetInst.ref.current;
  RNTooltips.Show(prevTarget, fluidTabsRef.current?.node?.current, {
    text: text,
    tintColor: "#000000",
    corner: Platform.OS === "ios" ? 5 : 40,
    textSize: 14,
    position: position,
    duration: 1000,
    autoHide: true,
    clickToHide: true
  });
}

const NativeTooltip = {
  show,
  POSITIONS
};

export default NativeTooltip;
