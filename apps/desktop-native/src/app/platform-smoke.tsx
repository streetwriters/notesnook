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

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clipboard,
  config,
  crypto,
  databaseHost,
  environment,
  files,
  imageCompressor,
  integration,
  keyboard,
  kvStore,
  lifecycle,
  notifications,
  safeStorage,
  spellChecker,
  updater,
  webauthn
} from "@platform";
import { Button, Flex, ScrollContainer, Text } from "@ui";
import { createPickedFile } from "./utils/picked-file";

type Check = { name: string; run: () => Promise<void> };

const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer | Uint8Array) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal(actual: unknown, expected: unknown, label: string) {
  assert(
    actual === expected,
    `${label}: expected ${String(expected)}, got ${String(actual)}`
  );
}

const PNG_1X1 = fromHex(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da636460f85f0f0002870180eb47ba920000000049454e44ae426082"
);

const checks: Check[] = [
  {
    name: "config",
    run: async () => {
      config.set("platform-smoke", { a: 1 });
      assert(
        (config.get<{ a: number }>("platform-smoke") as { a: number }).a === 1,
        "get after set"
      );
      config.remove("platform-smoke");
      equal(config.get("platform-smoke", "none"), "none", "get after remove");
    }
  },
  {
    name: "kvstore",
    run: async () => {
      const store = kvStore.create("platform-smoke");
      const bytes = new Uint8Array([1, 2, 3, 250]);
      await store.set("bytes", bytes);
      const read = await store.get<Uint8Array>("bytes");
      assert(read, "value missing");
      equal(hex(read), hex(bytes), "bytes round trip");
      assert((await store.keys()).includes("bytes"), "keys");
      await store.delete("bytes");
      equal(await store.get("bytes"), undefined, "after delete");
    }
  },
  {
    name: "safestorage",
    run: async () => {
      if (!(await safeStorage.isEncryptionAvailable())) return;
      const encrypted = await safeStorage.encryptString("secret value");
      equal(await safeStorage.decryptString(encrypted), "secret value", "text");
    }
  },
  {
    name: "random",
    run: async () => {
      const a = crypto.getRandomValues(new Uint8Array(32));
      const b = crypto.getRandomValues(new Uint8Array(32));
      assert(hex(a) !== hex(b), "two random buffers are equal");
      assert(
        a.some((byte) => byte !== 0),
        "all zero"
      );
    }
  },
  {
    name: "xxh64",
    run: async () => {
      equal(await crypto.xxh64(""), "ef46db3751d8e999", "empty");
      equal(await crypto.xxh64("a"), "d24ec4f1a98c6e5b", "a");
    }
  },
  {
    name: "digest",
    run: async () => {
      equal(
        hex(await crypto.subtle.digest("SHA-256", encoder.encode("abc"))),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        "sha-256"
      );
    }
  },
  {
    name: "aesgcm",
    run: async () => {
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cipher = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode("hello world")
      );
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        cipher
      );
      equal(new TextDecoder().decode(plain), "hello world", "round trip");
    }
  },
  {
    name: "aeskw",
    run: async () => {
      const wrapping = await crypto.subtle.generateKey(
        { name: "AES-KW", length: 256 },
        true,
        ["wrapKey", "unwrapKey"]
      );
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const wrapped = await crypto.subtle.wrapKey("raw", key, wrapping, {
        name: "AES-KW"
      });
      const unwrapped = await crypto.subtle.unwrapKey(
        "raw",
        wrapped,
        wrapping,
        { name: "AES-KW" },
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      equal(
        hex(await crypto.subtle.exportKey("raw", unwrapped)),
        hex(await crypto.subtle.exportKey("raw", key)),
        "unwrapped key"
      );
    }
  },
  {
    name: "pbkdf2",
    run: async () => {
      const base = await crypto.subtle.importKey(
        "raw",
        encoder.encode("password"),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      for (const [iterations, expected] of [
        [1, "120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b"],
        [2, "ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43"]
      ] as const) {
        const bits = await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: encoder.encode("salt"),
            iterations,
            hash: "SHA-256"
          },
          base,
          256
        );
        equal(hex(bits), expected, `iterations ${iterations}`);
      }
    }
  },
  {
    name: "hkdf",
    run: async () => {
      const ikm = new Uint8Array(22).fill(0x0b);
      const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, [
        "deriveBits"
      ]);
      const bits = await crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: fromHex("000102030405060708090a0b0c"),
          info: fromHex("f0f1f2f3f4f5f6f7f8f9")
        },
        base,
        42 * 8
      );
      equal(
        hex(bits),
        "3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865",
        "okm"
      );
    }
  },
  {
    name: "imagecompressor",
    run: async () => {
      const file = createPickedFile(PNG_1X1, "pixel.png", "image/png");
      const output = await imageCompressor.compress(file, {
        maxWidth: 100,
        quality: 0.8
      });
      assert(output.byteLength > 0, "empty output");
    }
  },
  {
    name: "files",
    run: async () => {
      const path = `${environment.tempDirectory}/platform-smoke.txt`;
      const file = await files.createAt(path);
      await file.write(encoder.encode("platform smoke"));
      await file.close();
      equal(
        new TextDecoder().decode(await files.readBytes(path)),
        "platform smoke",
        "read back"
      );
    }
  },
  {
    name: "clipboard",
    run: async () => {
      await clipboard.write({ "text/plain": "platform smoke" });
    }
  },
  {
    name: "notifications",
    run: async () => {
      equal(
        typeof (await notifications.isPermissionGranted()),
        "boolean",
        "permission"
      );
    }
  },
  {
    name: "spellchecker",
    run: async () => {
      const ranges = await spellChecker.check("helo wrold");
      equal(ranges.length, 2, "misspelled ranges");
      assert((await spellChecker.suggest("helo")).length > 0, "suggestions");
    }
  },
  {
    name: "keyboard",
    run: async () => {
      const unsubscribe = keyboard.register(["ctrl+shift+f12"], () => {});
      equal(typeof unsubscribe, "function", "unsubscribe");
      unsubscribe();
      const unsubscribeUp = keyboard.onKeyUp(() => {});
      equal(typeof unsubscribeUp, "function", "keyup unsubscribe");
      unsubscribeUp();
    }
  },
  {
    name: "lifecycle",
    run: async () => {
      equal(typeof lifecycle.isOnline(), "boolean", "isOnline");
      const stop = lifecycle.startIdleDetection(60000, () => {});
      equal(typeof stop, "function", "idle unsubscribe");
      stop();
    }
  },
  {
    name: "integration",
    run: async () => {
      assert((await integration.getZoomFactor()) > 0, "zoom factor");
      equal(typeof (await integration.getPrivacyMode()), "boolean", "privacy");
      equal(typeof (await integration.getProxyRules()), "string", "proxy");
    }
  },
  {
    name: "updater",
    run: async () => {
      const track = await updater.getReleaseTrack();
      assert(track === "stable" || track === "beta", `track ${track}`);
    }
  },
  {
    name: "webauthn",
    run: async () => {
      const available = await webauthn.isAvailable();
      if (!available) return;
      const pin = "1234";
      const registration = await webauthn.register({
        userId: crypto.getRandomValues(new Uint8Array(16)),
        userName: "smoke",
        pin
      });
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const first = await webauthn.getPrf({
        credentialId: registration.credentialId,
        salt,
        pin
      });
      const second = await webauthn.getPrf({
        credentialId: registration.credentialId,
        salt,
        pin
      });
      equal(first.length, 32, "prf length");
      equal(hex(first), hex(second), "prf is stable");
    }
  },
  {
    name: "database",
    run: async () => {
      assert((await databaseHost.getDatabaseKey()).length > 0, "empty key");
    }
  },
  {
    name: "environment",
    run: async () => {
      assert(environment.version, "version");
      assert(environment.appTitle, "appTitle");
      assert(environment.tempDirectory, "tempDirectory");
      assert(environment.backupsDirectory, "backupsDirectory");
      equal(environment.platform, "desktop", "platform");
    }
  }
];

export function PlatformSmoke() {
  const [results, setResults] = useState<Record<string, string>>({});
  const running = useRef(false);

  const runAll = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setResults({});
    for (const check of checks) {
      let result = "ok";
      try {
        await check.run();
      } catch (e) {
        result = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
      }
      setResults((current) => ({ ...current, [check.name]: result }));
    }
    running.current = false;
  }, []);

  useEffect(() => {
    runAll();
  }, [runAll]);

  return (
    <Flex
      testID="platform-smoke"
      sx={{ flex: 1, flexDirection: "column", bg: "background", p: 3, gap: 2 }}
    >
      <Button testID="run-checks" onPress={runAll}>
        <Text>Run checks</Text>
      </Button>
      <ScrollContainer>
        <Flex sx={{ flexDirection: "column", gap: 1 }}>
          {checks.map((check) => (
            <Flex
              key={check.name}
              sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}
            >
              <Text sx={{ color: "paragraph", width: 140 }}>{check.name}</Text>
              <Text testID={`check-${check.name}`} sx={{ color: "paragraph" }}>
                {results[check.name] ?? "running"}
              </Text>
            </Flex>
          ))}
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}
