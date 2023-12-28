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
} from "react-native-fingerprint-scanner";
import * as Keychain from "react-native-keychain";
import { MMKV } from "../common/database/mmkv";
import Storage from "../common/database/storage";
import { useSettingStore } from "../stores/use-setting-store";
import { ToastOptions, ToastManager } from "./event-manager";

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
    }, 1000);
    FingerprintScanner.release();
    return await Keychain.getInternetCredentials("nn_vault");
  } catch (error) {
    const e = error as { name: string };
    useSettingStore.getState().setRequestBiometrics(false);
    FingerprintScanner.release();
    let message: ToastOptions = {
      heading: "Authentication with biometrics failed.",
      message: 'Tap "Biometric Unlock" to try again.',
      type: "error",
      context: "local"
    };
    if (e.name === "DeviceLocked") {
      message = {
        heading: "Biometrics authentication failed.",
        message: "Wait 30 seconds to try again.",
        type: "error",
        context: "local"
      };
    } else if (e.name === "UserFallback") {
      message = {
        heading: "Authentication cancelled by user.",
        message: 'Tap "Biometric Unlock" to try again.',
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
    FingerprintScanner.release();
    return true;
  } catch (error) {
    const e = error as { name: string };
    FingerprintScanner.release();
    if (e.name === "DeviceLocked") {
      ToastManager.show({
        heading: "Biometrics authentication failed.",
        message: "Wait 30 seconds to try again.",
        type: "error",
        context: "local"
      });
    } else {
      ToastManager.show({
        heading: "Authentication failed.",
        message: "Tap to try again.",
        type: "error",
        context: "local"
      });
    }
    return false;
  }
}

const BiometicService = {
  isBiometryAvailable,
  enableFingerprintAuth,
  isFingerprintAuthEnabled,
  resetCredentials,
  getCredentials,
  storeCredentials,
  hasInternetCredentials,
  validateUser
};

export default BiometicService;
