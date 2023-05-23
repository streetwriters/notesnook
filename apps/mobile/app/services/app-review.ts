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
import InAppReview from "react-native-in-app-review";
import { DatabaseLogger } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import Config from "react-native-config";
import { useUserStore } from "../stores/use-user-store";

const day_ms = 86400000;
export function requestInAppReview() {
  if (Config.GITHUB_RELEASE === "true") return;

  const time = MMKV.getMap<{ timestamp: number }>("requestInAppReview");

  if (time?.timestamp && time?.timestamp + day_ms * 7 > Date.now()) {
    return;
  }

  if (InAppReview.isAvailable()) {
    useUserStore.getState().setShouldBlockVerifyUser(true);

    InAppReview.RequestInAppReview()
      .then(() => {})
      .catch((error) => {
        DatabaseLogger.error(error);
      });
    MMKV.setMap("requestInAppReview", { timestamp: Date.now() });
  } else {
    DatabaseLogger.error(new Error("In App Review not available"));
  }
}
