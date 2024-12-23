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

import Sodium, { Cipher, Password } from "@ammarahmed/react-native-sodium";
import { SerializedKey } from "@notesnook/crypto";
import { Platform } from "react-native";
import "react-native-get-random-values";
import * as Keychain from "react-native-keychain";
import { MMKVLoader, ProcessingModes } from "react-native-mmkv-storage";
import { generateSecureRandom } from "react-native-securerandom";
import { DatabaseLogger } from ".";
import { ToastManager } from "../../services/event-manager";
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

const NOTESNOOK_APPLOCK_KEY_SALT = "kBwr1Kre86ebOZ8ThLu2OA";
const NOTESNOOK_DB_KEY_SALT = "SNuzOcEK3amoqL0WvPeKqw";

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
  //@ts-ignore
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

export async function encryptDatabaseKeyWithPassword(appLockPassword: string) {
  const key = (await getDatabaseKey()) as string;
  const appLockCredentials = await Sodium.deriveKey(
    appLockPassword,
    NOTESNOOK_APPLOCK_KEY_SALT
  );
  const databaseKeyCipher = (await encrypt(appLockCredentials, key)) as Cipher;
  MMKV.setMap(DB_KEY_CIPHER, databaseKeyCipher);
  // We reset the database key from keychain once app lock password is set.
  await Keychain.resetInternetCredentials(KEYCHAIN_SERVER_DBKEY);
  return true;
}

export async function restoreDatabaseKeyToKeyChain(appLockPassword: string) {
  const databaseKeyCipher: Cipher = CipherStorage.getMap(DB_KEY_CIPHER);
  const databaseKey = (await decrypt(
    {
      password: appLockPassword
    },
    databaseKeyCipher
  )) as string;

  await Keychain.setInternetCredentials(
    KEYCHAIN_SERVER_DBKEY,
    "notesnook",
    databaseKey,
    KEYSTORE_CONFIG
  );
  MMKV.removeItem(DB_KEY_CIPHER);
  return true;
}

export async function setAppLockVerificationCipher(appLockPassword: string) {
  try {
    const appLockCredentials = await Sodium.deriveKey(
      appLockPassword,
      NOTESNOOK_APPLOCK_KEY_SALT
    );
    const encrypted = (await encrypt(
      appLockCredentials,
      generatePassword()
    )) as Cipher;
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

export async function validateAppLockPassword(appLockPassword: string) {
  try {
    const appLockCipher: Cipher = CipherStorage.getMap(APPLOCK_CIPHER);
    if (!appLockCipher) return true;
    const key = await Sodium.deriveKey(appLockPassword, appLockCipher.salt);
    const decrypted = await decrypt(key, appLockCipher);

    DatabaseLogger.info(
      `validateAppLockPassword: ${typeof decrypted === "string"}`
    );
    return typeof decrypted === "string";
  } catch (e) {
    DatabaseLogger.error(e);
    return false;
  }
}

let DB_KEY: string | undefined;
export function clearDatabaseKey() {
  DB_KEY = undefined;
  DatabaseLogger.info("Cleared database key");
}

export async function getDatabaseKey(appLockPassword?: string) {
  if (DB_KEY) return DB_KEY;
  try {
    if (appLockPassword) {
      const databaseKeyCipher: Cipher =
        CipherStorage.getMap("databaseKeyCipher");
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
        const credentials = await Keychain.getInternetCredentials(
          KEYCHAIN_SERVER_DBKEY
        );

        DatabaseLogger.info("Getting database key from Keychain");
        DB_KEY = (credentials as Keychain.UserCredentials).password;
      }
    }

    if (!DB_KEY) {
      DatabaseLogger.info("Generating new database key");
      const password = generatePassword();
      const derivedDatabaseKey = await Sodium.deriveKey(
        password,
        NOTESNOOK_DB_KEY_SALT
      );

      DB_KEY = derivedDatabaseKey.key as string;

      await Keychain.setInternetCredentials(
        KEYCHAIN_SERVER_DBKEY,
        "notesnook",
        DB_KEY,
        KEYSTORE_CONFIG
      );
    }

    if (await Keychain.hasInternetCredentials("notesnook")) {
      const userKeyCredentials = await Keychain.getInternetCredentials(
        "notesnook"
      );

      if (userKeyCredentials) {
        const userKeyCipher: Cipher = (await encrypt(
          {
            key: DB_KEY,
            salt: NOTESNOOK_DB_KEY_SALT
          },
          userKeyCredentials.password
        )) as Cipher;
        // Store encrypted user key in MMKV
        MMKV.setMap(USER_KEY_CIPHER, userKeyCipher);
        await Keychain.resetInternetCredentials("notesnook");
      }
      DatabaseLogger.info("Migrated user credentials to cipher storage");
    }

    return DB_KEY;
  } catch (e) {
    ToastManager.error(e as Error, "Error getting database key");
    console.log(e, "error");
    DatabaseLogger.error(e);
    return null;
  }
}

export async function deriveCryptoKeyFallback(data: SerializedKey) {
  if (Platform.OS !== "ios") return;
  try {
    if (!data.password || !data.salt)
      throw new Error(
        "Invalid password and salt provided to deriveCryptoKeyFallback"
      );

    const credentials = await Sodium.deriveKeyFallback?.(
      data.password,
      data.salt
    );

    if (!credentials) return;

    const userKeyCipher = (await encrypt(
      {
        key: (await getDatabaseKey()) as string,
        salt: NOTESNOOK_DB_KEY_SALT
      },
      credentials.key as string
    )) as Cipher<"base64">;
    DatabaseLogger.info("User key fallback stored: ", {
      userKeyCipher: !!userKeyCipher
    });

    // Store encrypted user key in MMKV
    MMKV.setMap(USER_KEY_CIPHER, userKeyCipher);
  } catch (e) {
    DatabaseLogger.error(e);
  }
}

export async function deriveCryptoKey(data: SerializedKey) {
  try {
    if (!data.password || !data.salt)
      throw new Error("Invalid password and salt provided to deriveCryptoKey");

    const credentials = (await Sodium.deriveKey(
      data.password,
      data.salt
    )) as Password;
    const userKeyCipher = (await encrypt(
      {
        key: (await getDatabaseKey()) as string,
        salt: NOTESNOOK_DB_KEY_SALT
      },
      credentials.key as string
    )) as Cipher<"base64">;
    DatabaseLogger.info("User key stored: ", {
      userKeyCipher: !!userKeyCipher
    });

    // Store encrypted user key in MMKV
    MMKV.setMap(USER_KEY_CIPHER, userKeyCipher);
  } catch (e) {
    DatabaseLogger.error(e);
  }
}

export async function getCryptoKey() {
  try {
    const keyCipher: Cipher = MMKV.getMap(USER_KEY_CIPHER);
    if (!keyCipher) {
      DatabaseLogger.info("User key cipher is null");
      return undefined;
    }

    const key = await decrypt(
      {
        key: (await getDatabaseKey()) as string,
        salt: keyCipher.salt
      },
      keyCipher
    );

    return key;
  } catch (e) {
    console.log("getCryptoKey", e);
    DatabaseLogger.error(e);
  }
}

export async function removeCryptoKey() {
  try {
    MMKV.removeItem(USER_KEY_CIPHER);
    await Keychain.resetInternetCredentials("notesnook");
    return true;
  } catch (e) {
    DatabaseLogger.error(e);
  }
}

export async function getRandomBytes(length: number) {
  return await generateSecureRandom(length);
}

export async function hash(
  password: string,
  email: string,
  options?: { usesFallback?: boolean }
) {
  DatabaseLogger.log(`Hashing password: fallback: ${options?.usesFallback}`);

  if (options?.usesFallback && Platform.OS !== "ios") {
    return "";
  }

  return (
    options?.usesFallback
      ? await Sodium.hashPasswordFallback?.(password, email)
      : await Sodium.hashPassword(password, email)
  ) as string;
}

export async function generateCryptoKey(password: string, salt?: string) {
  return Sodium.deriveKey(password, salt) as Promise<SerializedKey>;
}

export async function generateCryptoKeyFallback(
  password: string,
  salt?: string
): Promise<SerializedKey> {
  return Sodium.deriveKeyFallback?.(
    password,
    salt as string
  ) as Promise<SerializedKey>;
}

export function getAlgorithm(base64Variant: number) {
  return `xcha-argon2i13-${base64Variant}`;
}

export async function decrypt(password: SerializedKey, data: Cipher<"base64">) {
  const _data = { ...data };
  _data.output = "plain";

  if (!password.salt) password.salt = data.salt;

  if (Platform.OS === "ios" && !password.key && password.password) {
    const key = await Sodium.deriveKey(password.password, password.salt);
    try {
      return await Sodium.decrypt(key, _data);
    } catch (e) {
      const fallbackKey = await Sodium.deriveKeyFallback?.(
        password.password,
        password.salt
      );
      if (Platform.OS === "ios" && fallbackKey) {
        DatabaseLogger.info("Using fallback key for decryption");
      }
      if (fallbackKey) {
        return await Sodium.decrypt(fallbackKey, _data);
      } else {
        throw e;
      }
    }
  }

  return await Sodium.decrypt(password, _data);
}

export async function decryptMulti(
  password: Password,
  data: Cipher<"base64">[]
) {
  data = data.map((d) => {
    d.output = "plain";
    return d;
  });

  if (data.length && !password.salt) {
    password.salt = data[0].salt;
  }

  if (Platform.OS === "ios" && !password.key && password.password) {
    const key = await Sodium.deriveKey(password.password, password.salt);
    try {
      return await Sodium.decryptMulti(key, data);
    } catch (e) {
      const fallbackKey = await Sodium.deriveKeyFallback?.(
        password.password,
        password.salt as string
      );
      if (Platform.OS === "ios" && fallbackKey) {
        DatabaseLogger.info("Using fallback key for decryption");
      }
      if (fallbackKey) {
        return await Sodium.decryptMulti(fallbackKey, data);
      } else {
        throw e;
      }
    }
  }

  return await Sodium.decryptMulti(password, data);
}

export function parseAlgorithm(alg: string) {
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

export async function encrypt(password: SerializedKey, plainText: string) {
  const result = await Sodium.encrypt<"base64">(password, {
    type: "plain",
    data: plainText
  });

  return {
    ...result,
    alg: getAlgorithm(7)
  };
}

export async function encryptMulti(
  password: SerializedKey,
  plainText: string[]
) {
  const results = await Sodium.encryptMulti<"base64">(
    password,
    plainText.map((item) => ({
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
