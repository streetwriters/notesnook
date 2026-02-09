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

import { Cipher, SerializedKey, SerializedKeyPair } from "@notesnook/crypto";
import Database from ".";
import { isCipher } from "../utils";

const KEY_INFO = {
  inboxKeys: {
    type: "asymmetric"
  },
  attachmentsKey: {
    type: "symmetric"
  },
  monographPasswordsKey: {
    type: "symmetric"
  },
  dataEncryptionKey: {
    type: "symmetric"
  },
  legacyDataEncryptionKey: {
    type: "symmetric"
  }
} as const;

export type KeyId = keyof typeof KEY_INFO;

type WrapKeyReturnType<T extends SerializedKeyPair | SerializedKey> =
  T extends SerializedKeyPair
    ? { public: string; private: Cipher<"base64"> }
    : Cipher<"base64">;

type WrappedKey =
  | Cipher<"base64">
  | {
      public: string;
      private: Cipher<"base64">;
    };

type UnwrapKeyReturnType<T extends WrappedKey> = T extends {
  public: string;
  private: Cipher<"base64">;
}
  ? SerializedKeyPair
  : SerializedKey;

type KeyTypeFromId<TId extends KeyId> =
  (typeof KEY_INFO)[TId]["type"] extends "symmetric"
    ? Cipher<"base64">
    : {
        public: string;
        private: Cipher<"base64">;
      };

export class KeyManager {
  private cache = new Map<string, KeyTypeFromId<KeyId>>();
  constructor(private readonly db: Database) {}

  clearCache() {
    this.cache.clear();
  }

  async get<TId extends KeyId>(
    id: TId,
    options: {
      useCache?: boolean;
      refetchUser?: boolean;
    } = { refetchUser: true, useCache: true }
  ): Promise<KeyTypeFromId<TId> | undefined> {
    if (options.useCache && this.cache.has(id)) {
      return this.cache.get(id) as KeyTypeFromId<TId>;
    }
    let user = await this.db.user.getUser();
    if ((!user || !user[id]) && options.refetchUser) {
      user = await this.db.user.fetchUser();
    }
    if (!user) return;

    this.cache.set(id, user[id] as KeyTypeFromId<KeyId>);
    return user[id] as KeyTypeFromId<TId>;
  }

  async unwrapKey<T extends WrappedKey>(
    key: T,
    wrappingKey: SerializedKey
  ): Promise<UnwrapKeyReturnType<T>> {
    if (isCipher(key))
      return JSON.parse(
        await this.db.storage().decrypt(wrappingKey, key)
      ) as UnwrapKeyReturnType<T>;
    else {
      const privateKey = await this.db
        .storage()
        .decrypt(wrappingKey, key.private);
      return {
        publicKey: key.public,
        privateKey
      } as UnwrapKeyReturnType<T>;
    }
  }

  async wrapKey<T extends SerializedKey | SerializedKeyPair>(
    key: T,
    wrappingKey: SerializedKey
  ): Promise<WrapKeyReturnType<T>> {
    if (!("publicKey" in key)) {
      return (await this.db
        .storage()
        .encrypt(wrappingKey, JSON.stringify(key))) as WrapKeyReturnType<T>;
    } else {
      const encryptedPrivateKey = await this.db
        .storage()
        .encrypt(wrappingKey, (key as SerializedKeyPair).privateKey);
      return {
        public: (key as SerializedKeyPair).publicKey,
        private: encryptedPrivateKey
      } as WrapKeyReturnType<T>;
    }
  }

  async rewrapKey<T extends WrappedKey>(
    key: T,
    oldWrappingKey: SerializedKey,
    newWrappingKey: SerializedKey
  ) {
    const unwrappedKey = await this.unwrapKey(key, oldWrappingKey);
    return await this.wrapKey(unwrappedKey, newWrappingKey);
  }
}
