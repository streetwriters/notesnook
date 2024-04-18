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

export type SecurityKeyConfig = {
  firstSalt: Uint8Array;
  label: string;
  rawId: ArrayBuffer;
  transports: AuthenticatorTransport[];
};

async function registerSecurityKey(userId: BufferSource, username: string) {
  const challenge = window.crypto.getRandomValues(new Uint32Array(1));
  const firstSalt = window.crypto.getRandomValues(new Uint8Array(32));
  const result = await navigator.credentials.create({
    publicKey: {
      challenge: challenge,
      rp: {
        name: "Notesnook"
      },
      user: {
        id: userId,
        name: `${username} (${getFormattedDate(new Date(), "date-time")})`,
        displayName: username
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "required",
        requireResidentKey: true,
        authenticatorAttachment: "cross-platform"
      },
      extensions: {
        prf: {
          eval: {
            first: firstSalt
          }
        }
      },
      hints: ["security-key"]
    }
  });

  if (
    !result ||
    !(result instanceof PublicKeyCredential) ||
    !result.getClientExtensionResults().prf?.enabled
  )
    throw new Error(
      "Could not register security key: your browser or security key does not support the PRF WebAuthn extension."
    );

  return {
    id: result.id,
    firstSalt,
    transports: (
      result.response as AuthenticatorAttestationResponse
    ).getTransports() as AuthenticatorTransport[],
    rawId: result.rawId
  };
}

async function getEncryptionKey(config: {
  rawId: BufferSource;
  firstSalt: BufferSource;
  label: string;
  transports: AuthenticatorTransport[];
}) {
  const { firstSalt, label, rawId, transports } = config;
  const challenge = window.crypto.getRandomValues(new Uint32Array(1));
  const result = await navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      userVerification: "required",
      allowCredentials: [
        {
          id: rawId,
          type: "public-key",
          transports
        }
      ],
      extensions: {
        prf: {
          eval: {
            first: firstSalt
          }
        }
      },
      hints: ["security-key"]
    }
  });

  if (!result || !(result instanceof PublicKeyCredential))
    throw new Error("Invalid response.");

  const extensionResult = result.getClientExtensionResults();

  if (!extensionResult.prf?.results?.first)
    throw new Error(
      "Could not create encryption key: the WebAuthn PRF response did not include salt bytes."
    );

  const key = extensionResult.prf.results.first;
  const keyDerivationKey = await window.crypto.subtle.importKey(
    "raw",
    new Uint8Array(key),
    "HKDF",
    false,
    ["deriveKey"]
  );

  // Never forget what you set this value to or the key
  // can't be derived later
  const info = new TextEncoder().encode(label);
  // `salt` is a required argument for `deriveKey()`, but
  // should be empty
  const salt = new Uint8Array();
  const encryptionKey = await crypto.subtle.deriveKey(
    { name: "HKDF", info, salt, hash: "SHA-256" },
    keyDerivationKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );

  return { encryptionKey };
}

export const WebAuthn = { registerSecurityKey, getEncryptionKey };
