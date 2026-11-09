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

import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { StreamableFS } from "@notesnook/streamable-fs";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  createFileStore,
  decodeName,
  encodeName,
  type FileStoreFs
} from "./attachment-file-store";
import {
  ABYTES,
  checkUploadError,
  decryptedLength,
  parseS3Error,
  sodiumCacheDirectory
} from "./attachment-math";

const nodeFs: FileStoreFs = {
  mkdir,
  readFile: async (p) => new Uint8Array(await readFile(p)),
  writeFile,
  readdir,
  stat,
  rm
};

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "attachment-store-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function collect(stream: ReadableStream<Uint8Array>) {
  const out: number[][] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.push(Array.from(value));
  }
  return out;
}

describe("file store", () => {
  test("names round trip", () => {
    expect(decodeName(encodeName("a/b c-chunk-1"))).toBe("a/b c-chunk-1");
  });

  test("streamable fs writes, reads, lists and deletes a file", async () => {
    const sfs = new StreamableFS(createFileStore(nodeFs, `${root}/s`));
    expect(await sfs.exists("abc")).toBe(false);
    const handle = await sfs.createFile("abc", 5, "text/plain");
    const writer = handle.writeable.getWriter();
    await writer.write(new Uint8Array([1, 2, 3]));
    await writer.write(new Uint8Array([4, 5]));
    await writer.close();

    const read = await sfs.readFile("abc");
    expect(read?.file).toMatchObject({ filename: "abc", size: 5 });
    expect(read?.chunks).toHaveLength(2);
    expect(await read?.size()).toBe(5);
    expect(await collect(read!.readable)).toEqual([
      [1, 2, 3],
      [4, 5]
    ]);
    expect((await sfs.list()).sort()).toEqual(
      ["abc", "abc-chunk-0", "abc-chunk-1"].sort()
    );

    await sfs.deleteFile("abc");
    expect(await sfs.exists("abc")).toBe(false);
    expect(await sfs.list()).toEqual([]);
  });

  test("chunks are ordered numerically past ten", async () => {
    const sfs = new StreamableFS(createFileStore(nodeFs, `${root}/s`));
    const handle = await sfs.createFile("n", 12, "x");
    const writer = handle.writeable.getWriter();
    for (let i = 0; i < 12; i++) await writer.write(new Uint8Array([i]));
    await writer.close();
    const read = await sfs.readFile("n");
    expect((await collect(read!.readable)).flat()).toEqual(
      Array.from({ length: 12 }, (_, i) => i)
    );
  });

  test("additional data persists in the metadata", async () => {
    const sfs = new StreamableFS(createFileStore(nodeFs, `${root}/s`));
    const handle = await sfs.createFile("u", 1, "x");
    await handle.addAdditionalData("uploaded", true);
    expect((await sfs.readFile("u"))?.file.additionalData).toEqual({
      uploaded: true
    });
  });

  test("clear removes everything and the store stays usable", async () => {
    const sfs = new StreamableFS(createFileStore(nodeFs, `${root}/s`));
    await sfs.createFile("a", 1, "x");
    await sfs.clear();
    expect(await sfs.list()).toEqual([]);
    await sfs.createFile("a", 1, "x");
    expect(await sfs.exists("a")).toBe(true);
  });

  test("a missing directory lists as empty", async () => {
    const store = createFileStore(nodeFs, `${root}/s`);
    await rm(`${root}/s`, { recursive: true, force: true });
    await mkdir(`${root}/s`);
    expect(await store.list()).toEqual([]);
  });
});

describe("attachment math", () => {
  test("decrypted length removes one tag per chunk", () => {
    expect(decryptedLength(10 + ABYTES, 512 * 1024)).toBe(10);
    expect(decryptedLength(2 * (100 + ABYTES), 100)).toBe(200);
    expect(decryptedLength(100 + ABYTES + 5 + ABYTES, 100)).toBe(105);
  });

  test("upload check reports mismatches", () => {
    expect(checkUploadError(10 + ABYTES, 100, 10)).toBeUndefined();
    expect(checkUploadError(0, 100, 10)).toBe("File size is 0.");
    expect(checkUploadError(-1, 100, 10)).toBeDefined();
    expect(checkUploadError(20 + ABYTES, 100, 10)).toContain("mismatch");
  });

  test("sodium cache directory per os", () => {
    expect(sodiumCacheDirectory("macOS", "/Users/a")).toBe(
      "/Users/a/Library/Application Support/react-native-sodium/.cache"
    );
    expect(sodiumCacheDirectory("Linux", "/home/a", "/x")).toBe(
      "/x/react-native-sodium/.cache"
    );
    expect(sodiumCacheDirectory("Linux", "/home/a")).toBe(
      "/home/a/.local/share/react-native-sodium/.cache"
    );
  });

  test("s3 errors are parsed from xml and json", () => {
    expect(
      parseS3Error(
        "<Error><Code>NoSuchKey</Code><Message>gone</Message></Error>"
      )
    ).toEqual({ Code: "NoSuchKey", Message: "gone" });
    expect(parseS3Error({ error: "bad" })).toEqual({
      Code: "UNKNOWN",
      Message: "bad"
    });
  });
});
