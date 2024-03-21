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
import { MMKVLoader, ProcessingModes } from "react-native-mmkv-storage";
import { generateSecureRandom } from "react-native-securerandom";
import { DatabaseLogger } from ".";
import { MMKV } from "./mmkv";

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

const NOTESNOOK_APPLOCK_KEY_SALT = "3dqclWbOYllfk9kk";
const NOTESNOOK_DB_KEY_SALT = "2rcgSprDmRvZ1AAa";
const NOTESNOOK_USER_KEY_SALT = "7qO4qeoM6PbsAJ0Q";

const DB_KEY_CIPHER = "databaseKeyCipher";
const USER_KEY_CIPHER = "userKeyCipher";
const APPLOCK_CIPHER = "applockCipher";

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
    NOTESNOOK_APPLOCK_KEY_SALT
  );
  const databaseKeyCipher = await encrypt(appLockCredentials, key);
  MMKV.setMap(DB_KEY_CIPHER, databaseKeyCipher);
  // We reset the database key from keychain once app lock password is set.
  await Keychain.resetInternetCredentials(KEYCHAIN_SERVER_DBKEY);
  return true;
}

export async function restoreDatabaseKeyToKeyChain(appLockPassword) {
  const databaseKeyCipher = CipherStorage.getMap(DB_KEY_CIPHER);
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
  MMKV.removeItem(DB_KEY_CIPHER);
  return true;
}

export async function setAppLockVerificationCipher(appLockPassword) {
  try {
    const appLockCredentials = await Sodium.deriveKey(
      appLockPassword,
      NOTESNOOK_APPLOCK_KEY_SALT
    );
    const encrypted = await encrypt(appLockCredentials, generatePassword());

    CipherStorage.setMap(APPLOCK_CIPHER, encrypted);

    DatabaseLogger.info("setAppLockVerificationCipher");
  } catch (e) {
    DatabaseLogger.error(e);
    console.log(e);
  }
}

export async function clearAppLockVerificationCipher() {
  CipherStorage.removeItem(APPLOCK_CIPHER);
}

export async function validateAppLockPassword(appLockPassword) {
  try {
    const appLockCipher = CipherStorage.getMap(APPLOCK_CIPHER);
    if (!appLockCipher) return true;
    const decrypted = await decrypt(
      {
        password: appLockPassword
      },
      appLockCipher
    );
    DatabaseLogger.info(
      `validateAppLockPassword: ${typeof decrypted === "string"}`
    );
    return typeof decrypted === "string";
  } catch (e) {
    DatabaseLogger.error(e);
    return false;
  }
}

let DB_KEY;
export function clearDatabaseKey() {
  DB_KEY = undefined;
  DatabaseLogger.info("Cleared database key");
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
      DatabaseLogger.info("Getting database key from cipher");
      DB_KEY = databaseKey;
    }

    if (!DB_KEY) {
      const hasKey = await Keychain.hasInternetCredentials(
        KEYCHAIN_SERVER_DBKEY
      );
      if (hasKey) {
        let credentials = await Keychain.getInternetCredentials(
          KEYCHAIN_SERVER_DBKEY,
          KEYSTORE_CONFIG
        );

        DatabaseLogger.info("Getting database key from Keychain");
        DB_KEY = credentials.password;
      }
    }

    if (!DB_KEY) {
      DatabaseLogger.info("Generating new database key");
      const password = generatePassword();
      const derivedDatabaseKey = await Sodium.deriveKey(
        password,
        NOTESNOOK_DB_KEY_SALT
      );

      DB_KEY = derivedDatabaseKey.key;

      await Keychain.setInternetCredentials(
        KEYCHAIN_SERVER_DBKEY,
        "notesnook",
        DB_KEY,
        KEYSTORE_CONFIG
      );
    }

    if (await Keychain.hasInternetCredentials("notesnook")) {
      const userKeyCredentials = await Keychain.getInternetCredentials(
        "notesnook",
        KEYSTORE_CONFIG
      );

      if (userKeyCredentials) {
        const userKeyCipher = await encrypt(
          {
            key: DB_KEY,
            salt: NOTESNOOK_USER_KEY_SALT
          },
          userKeyCredentials.password
        );
        // Store encrypted user key in MMKV
        MMKV.setMap(USER_KEY_CIPHER, userKeyCipher);
        await Keychain.resetInternetCredentials("notesnook");
      }
      DatabaseLogger.info("Migrated user credentials to cipher storage");
    }

    return DB_KEY;
  } catch (e) {
    console.log(e, "error");
    DatabaseLogger.error(e);
    return null;
  }
}

export async function deriveCryptoKey(data) {
  try {
    let credentials = await Sodium.deriveKey(data.password, data.salt);
    const userKeyCipher = await encrypt(
      {
        key: await getDatabaseKey(),
        salt: NOTESNOOK_USER_KEY_SALT
      },
      credentials.key
    );
    DatabaseLogger.info("User key stored: ", !!userKeyCipher);

    // Store encrypted user key in MMKV
    MMKV.setMap(USER_KEY_CIPHER, userKeyCipher);
    return credentials.key;
  } catch (e) {
    DatabaseLogger.error(e);
  }
}

export async function getCryptoKey(_name) {
  try {
    const keyCipher = MMKV.getMap(USER_KEY_CIPHER);

    if (!keyCipher) {
      DatabaseLogger.info("User key cipher is null");
      return null;
    }

    const key = await decrypt(
      {
        key: await getDatabaseKey()
      },
      keyCipher
    );

    DatabaseLogger.info("User key decrypted: ", !!key);

    return key;
  } catch (e) {
    console.log("getCryptoKey", e);
    DatabaseLogger.error(e);
  }
}

export async function removeCryptoKey(_name) {
  try {
    MMKV.removeItem(USER_KEY_CIPHER);
    await Keychain.resetInternetCredentials("notesnook");
    return true;
  } catch (e) {
    DatabaseLogger.error(e);
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
    DatabaseLogger.error(e);
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

  if (!password.salt) password.salt = data.salt;

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

  if (data.length && !password.salt) {
    password.salt = data[0].salt;
  }

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
