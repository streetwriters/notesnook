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
import FingerprintScanner, {
  AuthenticateIOS
} from "@ammarahmed/react-native-fingerprint-scanner";
import * as Keychain from "react-native-keychain";
import { MMKV } from "../common/database/mmkv";
import { Storage } from "../common/database/storage";
import { useSettingStore } from "../stores/use-setting-store";
import { ToastOptions, ToastManager } from "./event-manager";
import { useUserStore } from "../stores/use-user-store";
import { strings } from "@notesnook/intl";

const KeychainConfig = Platform.select({
  ios: {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  },
  android: {}
});

async function isBiometryAvailable() {
  try {
    return await FingerprintScanner.isSensorAvailable();
  } catch (e) {
    return false;
  }
}

async function enableFingerprintAuth() {
  if (!isBiometryAvailable()) return;
  await Storage.write("fingerprintAuthEnabled", "enabled");
}

async function isFingerprintAuthEnabled() {
  return await MMKV.getStringAsync("fingerprintAuthEnabled");
}

async function storeCredentials(password: string) {
  await Keychain.setInternetCredentials(
    "nn_vault",
    "notesnookvault",
    password,
    KeychainConfig
  );
}

async function resetCredentials() {
  return await Keychain.resetInternetCredentials("nn_vault");
}

async function hasInternetCredentials() {
  return await Keychain.hasInternetCredentials("nn_vault");
}

async function getCredentials(title?: string, description?: string) {
  try {
    useSettingStore.getState().setRequestBiometrics(true);
    const options = Platform.select({
      ios: {
        fallbackEnabled: false,
        description: description
      },
      android: {
        title: title,
        description: description,
        deviceCredentialAllowed: false
      }
    });
    await FingerprintScanner.authenticate(options as AuthenticateIOS);
    setTimeout(() => {
      useSettingStore.getState().setRequestBiometrics(false);
    }, 500);
    FingerprintScanner.release();
    return await Keychain.getInternetCredentials("nn_vault");
  } catch (error) {
    const e = error as { name: string };
    setTimeout(() => {
      useUserStore.setState({
        disableAppLockRequests: false
      });
    }, 500);
    FingerprintScanner.release();
    let message: ToastOptions = {
      heading: strings.biometricsAuthFailed(),
      type: "error",
      context: "local"
    };
    if (e.name === "DeviceLocked") {
      message = {
        heading: strings.biometricsAuthFailed(),
        type: "error",
        context: "local"
      };
    } else if (e.name === "UserFallback") {
      message = {
        heading: strings.biometricsAuthCancelled(),
        type: "error",
        context: "local"
      };
    }

    setTimeout(() => ToastManager.show(message), 1000);
    return null;
  }
}

async function validateUser(title: string, description?: string) {
  try {
    useUserStore.setState({
      disableAppLockRequests: true
    });
    useSettingStore.getState().setAppDidEnterBackgroundForAction(true);
    await FingerprintScanner.authenticate(
      Platform.select({
        ios: {
          fallbackEnabled: false,
          description: title
        },
        android: {
          title: title,
          description: description,
          deviceCredentialAllowed: false
        }
      }) as AuthenticateIOS
    );
    setTimeout(() => {
      useUserStore.setState({
        disableAppLockRequests: false
      });
      useSettingStore.getState().setAppDidEnterBackgroundForAction(false);
    }, 500);
    FingerprintScanner.release();
    return true;
  } catch (error) {
    const e = error as { name: string };
    setTimeout(() => {
      useUserStore.setState({
        disableAppLockRequests: false
      });
      useSettingStore.getState().setAppDidEnterBackgroundForAction(false);
    }, 500);
    FingerprintScanner.release();
    if (e.name === "DeviceLocked") {
      ToastManager.show({
        heading: strings.biometricsAuthFailed(),
        type: "error",
        context: "local"
      });
    } else {
      ToastManager.show({
        heading: strings.biometricsAuthFailed(),
        type: "error",
        context: "local"
      });
    }
    return false;
  }
}

const BiometricService = {
  isBiometryAvailable,
  enableFingerprintAuth,
  isFingerprintAuthEnabled,
  resetCredentials,
  getCredentials,
  storeCredentials,
  hasInternetCredentials,
  validateUser
};

export default BiometricService;
