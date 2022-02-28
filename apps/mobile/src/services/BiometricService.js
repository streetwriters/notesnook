import FingerprintScanner from 'react-native-fingerprint-scanner';
import Storage from '../utils/database/storage';
import { ToastEvent } from './EventManager';
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';
import { MMKV } from '../utils/database/mmkv';
import { useSettingStore } from '../provider/stores';

const CRYPT_CONFIG = Platform.select({
  ios: {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  },
  android: {}
});

async function isBiometryAvailable() {
  try {
    return await FingerprintScanner.isSensorAvailable();
  } catch (e) {
    console.log(e, 'sensor not available');
    //ToastEvent.show(e.message, 'error');
    return false;
  }
}

async function enableFingerprintAuth() {
  if (!isBiometryAvailable()) return;
  await Storage.write('fingerprintAuthEnabled', 'enabled');
}

async function isFingerprintAuthEnabled() {
  return await MMKV.getStringAsync('fingerprintAuthEnabled', 'enabled');
}

async function storeCredentials(password) {
  await Keychain.setInternetCredentials('nn_vault', 'notesnookvault', password, CRYPT_CONFIG);
}

async function resetCredentials() {
  return await Keychain.resetInternetCredentials('nn_vault');
}

async function hasInternetCredentials() {
  return await Keychain.hasInternetCredentials('nn_vault');
}

async function getCredentials(title, description) {
  try {
    useSettingStore.getState().setRequestBiometrics(true);
    await FingerprintScanner.authenticate(
      Platform.select({
        ios: {
          fallbackEnabled: true,
          description: description
        },
        android: {
          title: title,
          description: description,
          deviceCredentialAllowed: true
        }
      })
    );
    FingerprintScanner.release();
    return await Keychain.getInternetCredentials('nn_vault', CRYPT_CONFIG);
  } catch (e) {
    useSettingStore.getState().setRequestBiometrics(false);
    FingerprintScanner.release();
    let message = {
      heading: 'Authentication with biometrics failed.',
      message: 'Tap "Biometric Unlock" to try again.',
      type: 'error',
      context: 'local'
    };
    if (e.name === 'DeviceLocked') {
      message = {
        heading: 'Biometrics authentication failed.',
        message: 'Wait 30 seconds to try again.',
        type: 'error',
        context: 'local'
      };
    } else if (e.name === 'UserFallback') {
      message = {
        heading: 'Authentication cancelled by user.',
        message: 'Tap "Biometric Unlock" to try again.',
        type: 'error',
        context: 'local'
      };
    }

    setTimeout(() => ToastEvent.show(message), 1000);
    return null;
  }
}

async function validateUser(title, description) {
  try {
    await FingerprintScanner.authenticate(
      Platform.select({
        ios: {
          fallbackEnabled: true,
          description: title
        },
        android: {
          title: title,
          description: description,
          deviceCredentialAllowed: true
        }
      })
    );
    FingerprintScanner.release();
    return true;
  } catch (e) {
    FingerprintScanner.release();
    if (e.name === 'DeviceLocked') {
      ToastEvent.show({
        heading: 'Biometrics authentication failed.',
        message: 'Wait 30 seconds to try again.',
        type: 'error',
        context: 'local'
      });
    } else {
      ToastEvent.show({
        heading: 'Authentication failed.',
        message: 'Tap to try again.',
        type: 'error',
        context: 'local'
      });
    }
    return false;
  }
}

export default {
  isBiometryAvailable,
  enableFingerprintAuth,
  isFingerprintAuthEnabled,
  resetCredentials,
  getCredentials,
  storeCredentials,
  hasInternetCredentials,
  validateUser
};
