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

import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import type { Lifecycle } from "../../../platform";

let online = true;
NetInfo.fetch().then((state) => {
  online = !!state.isInternetReachable || !!state.isConnected;
});
NetInfo.addEventListener((state) => {
  online = state.isInternetReachable !== false && !!state.isConnected;
});

let ignoreNext = false;

export const lifecycle: Lifecycle = {
  onVisibilityChanged(handler) {
    const subscription = AppState.addEventListener("change", (status) => {
      if (ignoreNext) {
        ignoreNext = false;
        return;
      }
      if (status === "active") handler("focus", false);
      else handler("blur", true);
    });
    return () => subscription.remove();
  },
  ignoreNextVisibilityChange() {
    ignoreNext = true;
  },
  onNetworkStatusChanged(handler) {
    return NetInfo.addEventListener((state) => {
      handler(
        state.isInternetReachable !== false && state.isConnected
          ? "online"
          : "offline"
      );
    });
  },
  isOnline: () => online,
  async waitForInternet() {
    const state = await NetInfo.fetch();
    return state.isInternetReachable !== false && !!state.isConnected;
  },
  startIdleDetection() {
    throw new Error("startIdleDetection is not implemented on desktop yet");
  }
};
