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
import { db } from "../common/database";
import { presentDialog } from "../components/dialog/functions";
import BiometricService from "../services/biometrics";
import { ToastManager } from "../services/event-manager";
import { useSettingStore } from "../stores/use-setting-store";

let unlockPromise: Promise<any> | undefined = undefined;
export async function unlockVault({
  context,
  title,
  paragraph
}: {
  context?: string;
  title: string;
  paragraph: string;
}) {
  if (unlockPromise) {
    return unlockPromise;
  }
  unlockPromise = new Promise(async (resolve) => {
    const result = await (async () => {
      if (db.vault.unlocked) return true;
      const biometry = await BiometricService.isBiometryAvailable();
      const fingerprint = await BiometricService.hasInternetCredentials();
      if (biometry && fingerprint) {
        const credentials = await BiometricService.getCredentials(
          title,
          paragraph
        );
        if (credentials) {
          return db.vault.unlock(credentials.password);
        }
      }
      useSettingStore.getState().setSheetKeyboardHandler(false);
      return new Promise((resolve) => {
        setImmediate(() => {
          presentDialog({
            context: context,
            input: true,
            secureTextEntry: true,
            positiveText: strings.unlock(),
            title: title,
            paragraph: paragraph,
            inputPlaceholder: strings.enterPassword(),
            positivePress: async (value) => {
              const unlocked = await db.vault.unlock(value);
              if (!unlocked) {
                ToastManager.show({
                  heading: strings.passwordIncorrect(),
                  type: "error",
                  context: "local"
                });
                return false;
              }
              resolve(unlocked);
              useSettingStore.getState().setSheetKeyboardHandler(true);
              return true;
            },
            onClose: () => {
              resolve(false);
              useSettingStore.getState().setSheetKeyboardHandler(true);
            }
          });
        });
      });
    })();
    unlockPromise = undefined;
    resolve(result);
  });
  return unlockPromise;
}
