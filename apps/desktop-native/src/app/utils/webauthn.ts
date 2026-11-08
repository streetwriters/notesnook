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

import { getFormattedDate } from "@notesnook/common";
import { webauthn } from "@platform";
import { randomBytes, subtle } from "../interfaces/subtle";

export type SecurityKeyConfig = {
  firstSalt: Uint8Array;
  label: string;
  rawId: ArrayBuffer;
  transports: string[];
};

function toBase64Url(bytes: Uint8Array) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) output += alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) output += alphabet[c & 63];
  }
  return output;
}

async function registerSecurityKey(
  userId: Uint8Array,
  username: string,
  pin: string
) {
  const firstSalt = randomBytes(32);
  const made = await webauthn.register({
    userId,
    userName: `${username} (${getFormattedDate(new Date(), "date-time")})`,
    displayName: username,
    pin
  });
  if (!made.prfEnabled)
    throw new Error(
      "Could not register security key: your security key does not support the PRF WebAuthn extension."
    );

  return {
    id: toBase64Url(made.credentialId),
    firstSalt,
    transports: made.transports,
    rawId: made.credentialId.buffer.slice(
      made.credentialId.byteOffset,
      made.credentialId.byteOffset + made.credentialId.byteLength
    ) as ArrayBuffer
  };
}

async function getEncryptionKey(
  config: {
    rawId: ArrayBuffer;
    firstSalt: Uint8Array;
    label: string;
    transports: string[];
  },
  pin: string
) {
  const { firstSalt, label, rawId } = config;
  const secret = await webauthn.getPrf({
    credentialId: new Uint8Array(rawId),
    salt: firstSalt,
    pin
  });

  const keyDerivationKey = await subtle.importKey(
    "raw",
    secret,
    "HKDF",
    false,
    ["deriveKey"]
  );

  const info = new TextEncoder().encode(label);
  const salt = new Uint8Array();
  const encryptionKey = await subtle.deriveKey(
    { name: "HKDF", info, salt, hash: "SHA-256" },
    keyDerivationKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );

  return { encryptionKey };
}

export const WebAuthn = { registerSecurityKey, getEncryptionKey };
