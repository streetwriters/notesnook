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

import { describe, expect, test, vi } from "vitest";
import { FileStorage } from "../fs.js";
import { EVENTS } from "../../common.js";
import EventManager from "../../utils/event-manager.js";
import TokenManager from "../../api/token-manager.js";
import { IFileStorage } from "../../interfaces.js";

type Kind = "upload" | "download";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(options: { noopCancel?: boolean } = {}) {
  const local = new Set<string>();
  const calls: Record<Kind, string[]> = { upload: [], download: [] };
  const canceled: string[] = [];
  const inflight = new Map<string, ReturnType<typeof deferred<boolean>>>();
  let existsGate: { reached: () => void; release: Promise<void> } | undefined;

  const transfer = (kind: Kind) => (filename: string) => {
    const result = deferred<boolean>();
    return {
      execute: async () => {
        calls[kind].push(filename);
        inflight.set(`${kind}:${filename}`, result);
        const ok = await result.promise;
        if (ok && kind === "download") local.add(filename);
        return ok;
      },
      cancel: async () => {
        canceled.push(`${kind}:${filename}`);
        if (!options.noopCancel) result.reject(new Error("canceled"));
      }
    };
  };

  const fs = {
    uploadFile: transfer("upload"),
    downloadFile: transfer("download"),
    exists: async (filename: string) => {
      const gate = existsGate;
      existsGate = undefined;
      gate?.reached();
      await gate?.release;
      return local.has(filename);
    },
    bulkExists: async (filenames: string[]) =>
      filenames.filter((f) => !local.has(f))
  } as unknown as IFileStorage;
  const tokenManager = {
    getAccessToken: async () => "token"
  } as unknown as TokenManager;
  const eventManager = new EventManager();
  const storage = new FileStorage(fs, tokenManager, eventManager);

  function events(name: string) {
    const list: any[] = [];
    eventManager.subscribe(name, (data: any) => list.push(data));
    return list;
  }

  async function started(kind: Kind, filename: string) {
    await vi.waitFor(() => {
      if (!inflight.has(`${kind}:${filename}`)) throw new Error("not started");
    });
  }

  function finish(kind: Kind, filename: string, ok = true) {
    inflight.get(`${kind}:${filename}`)?.resolve(ok);
  }

  function holdNextExists() {
    const reached = deferred<void>();
    const release = deferred<void>();
    existsGate = { reached: () => reached.resolve(), release: release.promise };
    return { reached: reached.promise, release: () => release.resolve() };
  }

  return {
    storage,
    calls,
    canceled,
    events,
    started,
    finish,
    holdNextExists
  };
}

const file = (filename: string) => ({ filename, chunkSize: 512 });
const eventData = { readOnDownload: false };

describe("FileStorage transfers", () => {
  test("cancelTransfers skips a download still waiting in the queue", async () => {
    const { storage, calls, events, started, finish } = setup();
    const downloaded = events(EVENTS.fileDownloaded);

    const queue = storage.queueDownloads(
      [file("a"), file("b")],
      "group",
      eventData
    );
    await started("download", "a");
    await storage.cancelTransfers("b");
    finish("download", "a");
    await queue;

    expect(calls.download).toEqual(["a"]);
    expect(downloaded.find((e) => e.filename === "b")).toMatchObject({
      success: false,
      canceled: true
    });
  });

  test("cancelTransfers landing during the local exists check prevents the download", async () => {
    const { storage, calls, events, holdNextExists } = setup();
    const downloaded = events(EVENTS.fileDownloaded);

    const gate = holdNextExists();
    const queue = storage.queueDownloads([file("a")], "group", eventData);
    await gate.reached;
    await storage.cancelTransfers("a");
    gate.release();
    await queue;

    expect(calls.download).toEqual([]);
    expect(downloaded).toEqual([
      expect.objectContaining({ filename: "a", canceled: true })
    ]);
  });

  test("cancelTransfers waits for an upload whose cancel does nothing", async () => {
    const { storage, events, started, finish } = setup({ noopCancel: true });
    const uploaded = events(EVENTS.fileUploaded);

    const queue = storage.queueUploads([file("a")], "sync");
    await started("upload", "a");
    let settled = false;
    const cancel = storage.cancelTransfers("a").then(() => (settled = true));
    await new Promise((r) => setTimeout(r, 20));
    expect(settled).toBe(false);

    finish("upload", "a");
    await cancel;
    await queue;

    expect(uploaded).toEqual([
      expect.objectContaining({ filename: "a", success: false, canceled: true })
    ]);
  });

  test("a canceled upload is not reported as an error", async () => {
    const { storage, events, started } = setup();
    const uploaded = events(EVENTS.fileUploaded);

    const queue = storage.queueUploads([file("a")], "sync");
    await started("upload", "a");
    await storage.cancelTransfers("a");
    await queue;

    expect(uploaded).toEqual([
      expect.objectContaining({ error: null, success: false, canceled: true })
    ]);
  });

  test("canceling a group keeps a transfer another group still needs", async () => {
    const { storage, calls, canceled, events, started, finish } = setup();
    const downloaded = events(EVENTS.fileDownloaded);

    const first = storage.queueDownloads([file("a")], "note-1", eventData);
    await started("download", "a");
    const second = storage.queueDownloads([file("a")], "note-2", eventData);
    await new Promise((r) => setTimeout(r, 10));

    await storage.cancel("note-1");
    finish("download", "a");
    await Promise.all([first, second]);

    expect(calls.download).toEqual(["a"]);
    expect(canceled).toEqual([]);
    expect(downloaded.find((e) => e.groupId === "note-2")).toMatchObject({
      success: true
    });
  });

  test("canceling a group aborts a transfer only it needed", async () => {
    const { storage, canceled, started } = setup();

    const download = storage.downloadFile("note", "a", 512);
    await started("download", "a");
    await storage.cancel("note");

    await expect(download).resolves.toBe(false);
    expect(canceled).toEqual(["download:a"]);
  });

  test("a group can be queued again right after it is canceled", async () => {
    const { storage, calls, started, finish } = setup({ noopCancel: true });

    const stale = storage.queueDownloads([file("a")], "note", eventData);
    await started("download", "a");
    await storage.cancel("note");

    const fresh = storage.queueDownloads([file("b")], "note", eventData);
    await started("download", "b");

    finish("download", "a");
    await stale;
    await storage.queueDownloads([file("c")], "note", eventData);

    finish("download", "b");
    await fresh;

    expect(calls.download).toEqual(["a", "b"]);
  });

  test("downloadFile in a group does not block a queue for the same group", async () => {
    const { storage, calls, started, finish } = setup();

    const single = storage.downloadFile("note", "a", 512);
    await started("download", "a");
    const queue = storage.queueDownloads([file("b")], "note", eventData);
    await started("download", "b");

    finish("download", "a");
    finish("download", "b");
    await expect(single).resolves.toBe(true);
    await queue;

    expect(calls.download).toEqual(["a", "b"]);
  });

  test("downloadFile joins an in-flight queue download instead of starting another", async () => {
    const { storage, calls, started, finish } = setup();

    const queue = storage.queueDownloads(
      [file("a")],
      "offline-mode",
      eventData
    );
    await started("download", "a");
    const single = storage.downloadFile("note", "a", 512);
    await new Promise((r) => setTimeout(r, 10));

    finish("download", "a");
    await expect(single).resolves.toBe(true);
    await queue;

    expect(calls.download).toEqual(["a"]);
  });

  test("duplicate files in an upload batch are uploaded once", async () => {
    const { storage, calls, events, started, finish } = setup();
    const uploaded = events(EVENTS.fileUploaded);

    const queue = storage.queueUploads([file("a"), file("a")], "sync");
    await started("upload", "a");
    finish("upload", "a");
    await queue;

    expect(calls.upload).toEqual(["a"]);
    expect(uploaded).toHaveLength(1);
  });
});
