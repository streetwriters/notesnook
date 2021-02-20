import FingerprintScanner from 'react-native-fingerprint-scanner';
import Storage from '../utils/storage';
import {ToastEvent} from './EventManager';
import * as Keychain from 'react-native-keychain';
import {Platform} from 'react-native';

const CRYPT_CONFIG = Platform.select({
  ios: {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  },
  android: {},
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
  return await Storage.read('fingerprintAuthEnabled', 'enabled');
}

async function storeCredentials(password) {
  await Keychain.setInternetCredentials(
    'nn_vault',
    'notesnookvault',
    password,
    CRYPT_CONFIG,
  );
}

async function resetCredentials() {
  return await Keychain.resetInternetCredentials('nn_vault');
}

async function hasInternetCredentials() {
  return await Keychain.hasInternetCredentials('nn_vault');
}

async function getCredentials(title, description) {
  try {
    await FingerprintScanner.authenticate(
      Platform.select({
        ios: {
          fallbackEnabled: true,
          description: description,
        },
        android: {
          title: title,
          description: description,
          deviceCredentialAllowed: true,
        },
      }),
    );
    console.log('allowed');
    FingerprintScanner.release();
    return await Keychain.getInternetCredentials('nn_vault', CRYPT_CONFIG);
  } catch (e) {
    console.log('failed');
    FingerprintScanner.release();
    if (e.name === 'DeviceLocked') {
      ToastEvent.show({
        heading: 'Biometrics authentication failed.',
        message: 'Wait 30 seconds to try again.',
        type: 'error',
        context: 'local',
      });
    } else {
      ToastEvent.show({
        heading: 'Authentication failed.',
        message: 'Tap to try again.',
        type: 'error',
        context: 'local',
      });
    }
    return null;
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
};
