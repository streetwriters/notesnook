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

import {
  DeviceEventEmitter,
  Dimensions,
  Keyboard,
  Platform
} from "react-native";

/**
 * Dismisses the keyboard and emits keyboard hide events across the React Native
 * bridge to purge any stale keyboard state/displacement (e.g. after ShareActivity
 * or quick note finishes abruptly without a native layout hide event).
 */
export function dismissAndResetKeyboard() {
  try {
    Keyboard.dismiss();
    const window = Dimensions.get("window");
    const payload = {
      duration: 0,
      easing: "keyboard",
      endCoordinates: {
        screenX: 0,
        screenY: window.height,
        width: window.width,
        height: 0
      }
    };
    DeviceEventEmitter.emit("keyboardDidHide", payload);
    if (Platform.OS === "ios") {
      DeviceEventEmitter.emit("keyboardWillHide", payload);
    }
  } catch (e) {
    console.error("Failed to reset keyboard state:", e);
  }
}
