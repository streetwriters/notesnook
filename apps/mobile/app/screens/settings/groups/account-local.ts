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

import { strings } from "@notesnook/intl";
import { db } from "../../../common/database";
import { MMKV } from "../../../common/database/mmkv";
import { presentDialog } from "../../../components/dialog/functions";
import BiometricService from "../../../services/biometrics";
import Navigation from "../../../services/navigation";
import PremiumService from "../../../services/premium";
import SettingsService from "../../../services/settings";
import { clearAllStores } from "../../../stores";
import { refreshAllStores } from "../../../stores/create-db-collection-store";
import { useUserStore } from "../../../stores/use-user-store";
import { resetTabStore } from "../../editor/tiptap/use-tab-store";
import { eSendEvent } from "../../../services/event-manager";
import { eAfterSync } from "../../../utils/events";
import { SettingSection } from "../types";

export const accountLocalGroup: SettingSection = {
  id: "account-local",
  name: strings.account(),
  useHook: () => useUserStore((state) => state.user),
  hidden: (current) => !!current,
  sections: [
    {
      id: "delete-data",
      name: strings.deleteData(),
      icon: "trash",
      iconFamily: "notesnook",
      description: strings.deleteAccountDesc(),
      modifer: () => {
        presentDialog({
          title: strings.deleteData(),
          paragraph: strings.irreverisibleAction(),
          positiveType: "errorShade",
          positiveText: "Delete data",
          positivePress: async () => {
            await PremiumService.setPremiumStatus();
            await BiometricService.resetCredentials();
            MMKV.clearStore();
            resetTabStore();
            clearAllStores();
            Navigation.queueRoutesForUpdate();
            SettingsService.resetSettings();
            db.reset();

            setImmediate(() => {
              refreshAllStores();
              eSendEvent(eAfterSync);
            });
            return true;
          }
        });
      }
    }
  ]
};
