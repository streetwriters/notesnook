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
    ToastEvent.show(e.message, 'error');
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

async function getCredentials() {
  try {
    await FingerprintScanner.authenticate(
      Platform.select({
        ios: {
          fallbackEnabled: true,
          description:
            'Biometrics are required to unlock note.',
        },
        android: {
          title: 'Unlock Note',
          description: 'Biometrics are required to unlock note.',
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
      ToastEvent.show(
        'Authentication failed. Wait 30 seconds to try again.',
        'error',
      );
    } else {
      ToastEvent.show('Authentication failed. Tap to try again.', 'error');
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
  hasInternetCredentials
};
