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

import Sodium from "@ammarahmed/react-native-sodium";
import { Platform } from "react-native";
import "react-native-get-random-values";
import * as Keychain from "react-native-keychain";
import { generateSecureRandom } from "react-native-securerandom";
import { MMKV } from "./mmkv";
import { ProcessingModes, MMKVLoader } from "react-native-mmkv-storage";

// Database key cipher is persisted across different user sessions hence it has
// it's independent storage which we will never clear. This is only used when application has
// app lock with password enabled.
export const CipherStorage = new MMKVLoader()
  .withInstanceID("cipher_storage")
  .setProcessingMode(
    Platform.OS === "ios"
      ? ProcessingModes.MULTI_PROCESS
      : ProcessingModes.SINGLE_PROCESS
  )
  .disableIndexing()
  .initialize();

const IOS_KEYCHAIN_ACCESS_GROUP = "group.org.streetwriters.notesnook";
const IOS_KEYCHAIN_SERVICE_NAME = "org.streetwriters.notesnook";
const KEYCHAIN_SERVER_DBKEY = "notesnook:db";

const KEYSTORE_CONFIG = Platform.select({
  ios: {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    accessGroup: IOS_KEYCHAIN_ACCESS_GROUP,
    service: IOS_KEYCHAIN_SERVICE_NAME
  },
  android: {}
});

function generatePassword() {
  const length = 80;
  const crypto = window.crypto || window.msCrypto;
  if (typeof crypto === "undefined") {
    throw new Error(
      "Crypto API is not supported. Please upgrade your web browser"
    );
  }
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&+_{}[]():<>/?;";
  const indexes = crypto.getRandomValues(new Uint32Array(length));
  let secret = "";
  for (const index of indexes) {
    secret += charset[index % charset.length];
  }
  return secret;
}

export async function encryptDatabaseKeyWithPassword(appLockPassword) {
  const key = getDatabaseKey();
  const appLockCredentials = await Sodium.deriveKey(
    appLockPassword,
    "notesnook_applock_key"
  );
  const databaseKeyCipher = await encrypt(appLockCredentials, key);
  MMKV.setMap("databaseKeyCipher", databaseKeyCipher);
  // We reset the database key from keychain once app lock password is set.
  await Keychain.resetInternetCredentials("notesnook:db");
  return true;
}

export async function restoreDatabaseKeyToKeyChain(appLockPassword) {
  const databaseKeyCipher = CipherStorage.getMap("databaseKeyCipher");
  const databaseKey = await decrypt(
    {
      password: appLockPassword
    },
    databaseKeyCipher
  );

  await Keychain.setInternetCredentials(
    KEYCHAIN_SERVER_DBKEY,
    "notesnook",
    databaseKey,
    KEYSTORE_CONFIG
  );
  MMKV.removeItem("databaseKeyCipher");
  return true;
}

export async function setAppLockVerificationCipher(appLockPassword) {
  try {
    console.log("key", appLockPassword);
    const appLockCredentials = await Sodium.deriveKey(
      appLockPassword,
      "notesnook_applock_key_salt"
    );
    const encrypted = await encrypt(appLockCredentials, "applock_password");

    CipherStorage.setMap("appLockCipher", encrypted);
  } catch (e) {
    console.log(e);
  }
}

export async function clearAppLockVerificationCipher() {
  CipherStorage.removeItem("appLockCipher");
}

export async function validateAppLockPassword(appLockPassword) {
  try {
    const appLockCipher = CipherStorage.getMap("appLockCipher");
    if (!appLockCipher) return true;
    const decrypted = await decrypt(
      {
        password: appLockPassword
      },
      appLockCipher
    );
    return decrypted === "applock_password";
  } catch (e) {
    console.error(e);
    return false;
  }
}

let DB_KEY;
export function clearDatabaseKey() {
  DB_KEY = undefined;
}

export async function getDatabaseKey(appLockPassword) {
  if (DB_KEY) return DB_KEY;
  try {
    if (appLockPassword) {
      const databaseKeyCipher = CipherStorage.getMap("databaseKeyCipher");
      const databaseKey = await decrypt(
        {
          password: appLockPassword
        },
        databaseKeyCipher
      );
      console.log("Getting database key from cipher");
      DB_KEY = databaseKey;
      return databaseKey;
    }

    const hasKey = await Keychain.hasInternetCredentials(KEYCHAIN_SERVER_DBKEY);
    if (hasKey) {
      let credentials = await Keychain.getInternetCredentials(
        KEYCHAIN_SERVER_DBKEY,
        KEYSTORE_CONFIG
      );
      console.log("Getting database key from Keychain");
      DB_KEY = credentials.password;
      return credentials.password;
    }
    console.log("Generating new database key");
    const password = generatePassword();
    const derivedDatabaseKey = await Sodium.deriveKey(
      password,
      "notesnook_database_key"
    );
    await Keychain.setInternetCredentials(
      KEYCHAIN_SERVER_DBKEY,
      "notesnook",
      derivedDatabaseKey.key,
      KEYSTORE_CONFIG
    );

    const userKeyCredentials = await Keychain.getInternetCredentials(
      "notesnook",
      KEYSTORE_CONFIG
    );

    if (userKeyCredentials) {
      const userKeyCipher = await encrypt(
        {
          key: derivedDatabaseKey.key
        },
        userKeyCredentials.password
      );
      // Store encrypted user key in MMKV
      MMKV.setMap("userKeyCipher", userKeyCipher);
      await Keychain.resetInternetCredentials("notesnook");
      console.log("Migrated user credentials to cipher");
    }

    DB_KEY = derivedDatabaseKey.key;

    return derivedDatabaseKey.key;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function deriveCryptoKey(name, data) {
  try {
    let credentials = await Sodium.deriveKey(data.password, data.salt);

    const userKeyCipher = await encrypt(
      {
        key: await getDatabaseKey()
      },
      credentials.key
    );
    // Store encrypted user key in MMKV
    MMKV.setMap("userKeyCipher", userKeyCipher);
    return credentials.key;
  } catch (e) {
    console.error(e);
  }
}

export async function getCryptoKey(_name) {
  try {
    const keyCipher = MMKV.getMap("userKeyCipher");
    if (!key) return null;

    const key = decrypt(
      {
        key: await getDatabaseKey()
      },
      keyCipher
    );

    return key;
  } catch (e) {
    console.error(e);
  }
}

export async function removeCryptoKey(_name) {
  try {
    MMKV.removeItem("userKeyCipher");
    await Keychain.resetInternetCredentials("notesnook");
    return true;
  } catch (e) {
    console.error(e);
  }
}

export async function getRandomBytes(length) {
  return await generateSecureRandom(length);
}

export async function hash(password, email) {
  let result = await Sodium.hashPassword(password, email);
  return result;
}

export async function generateCryptoKey(password, salt) {
  try {
    let credentials = await Sodium.deriveKey(password, salt || null);
    return credentials;
  } catch (e) {
    console.log("generateCryptoKey: ", e);
  }
}

export function getAlgorithm(base64Variant) {
  return `xcha-argon2i13-${base64Variant}`;
}

export async function decrypt(password, data) {
  if (!password.password && !password.key) return undefined;
  if (password.password && password.password === "" && !password.key)
    return undefined;
  let _data = { ...data };
  _data.output = "plain";
  return await Sodium.decrypt(password, _data);
}

export async function decryptMulti(password, data) {
  if (!password.password && !password.key) return undefined;
  if (password.password && password.password === "" && !password.key)
    return undefined;

  data = data.map((d) => {
    d.output = "plain";
    return d;
  });
  return await Sodium.decryptMulti(password, data);
}

export function parseAlgorithm(alg) {
  if (!alg) return {};
  const [enc, kdf, compressed, compressionAlg, base64variant] = alg.split("-");
  return {
    encryptionAlgorithm: enc,
    kdfAlgorithm: kdf,
    compressionAlgorithm: compressionAlg,
    isCompress: compressed === "1",
    base64_variant: base64variant
  };
}

export async function encrypt(password, data) {
  if (!password.password && !password.key) return undefined;
  if (password.password && password.password === "" && !password.key)
    return undefined;

  let message = {
    type: "plain",
    data: data
  };
  let result = await Sodium.encrypt(password, message);

  return {
    ...result,
    alg: getAlgorithm(7)
  };
}

export async function encryptMulti(password, data) {
  if (!password.password && !password.key) return undefined;
  if (password.password && password.password === "" && !password.key)
    return undefined;

  let results = await Sodium.encryptMulti(
    password,
    data.map((item) => ({
      type: "plain",
      data: item
    }))
  );

  return !results
    ? []
    : results.map((result) => ({
        ...result,
        alg: getAlgorithm(7)
      }));
}
