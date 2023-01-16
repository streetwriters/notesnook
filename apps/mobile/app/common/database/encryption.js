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
import "react-native-get-random-values";
import * as Keychain from "react-native-keychain";
import { generateSecureRandom } from "react-native-securerandom";
import Sodium from "@ammarahmed/react-native-sodium";

const KEYSTORE_CONFIG = Platform.select({
  ios: {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  },
  android: {}
});

export async function deriveCryptoKey(name, data) {
  try {
    let credentials = await Sodium.deriveKey(data.password, data.salt);
    await Keychain.setInternetCredentials(
      "notesnook",
      name,
      credentials.key,
      KEYSTORE_CONFIG
    );
    return credentials.key;
  } catch (e) {
    console.error(e);
  }
}

export async function getCryptoKey(_name) {
  try {
    if (await Keychain.hasInternetCredentials("notesnook")) {
      let credentials = await Keychain.getInternetCredentials(
        "notesnook",
        KEYSTORE_CONFIG
      );
      return credentials.password;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
  }
}

export async function removeCryptoKey(_name) {
  try {
    let result = await Keychain.resetInternetCredentials("notesnook");
    return result;
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
