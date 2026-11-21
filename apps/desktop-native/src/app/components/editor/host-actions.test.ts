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
import {
  createEditorHostActions,
  pathFromFileUrl,
  type HostActionDeps
} from "./host-actions";

function makeDeps(overrides: Partial<HostActionDeps> = {}) {
  const deps: HostActionDeps = {
    openInternalLink: vi.fn(() => false),
    openUrl: vi.fn(),
    openPath: vi.fn(async () => {}),
    saveAttachment: vi.fn(async () => {}),
    previewAttachment: vi.fn(async () => {}),
    canAttach: vi.fn(() => true),
    pickAndAttach: vi.fn(async () => {}),
    attachFiles: vi.fn(async () => {}),
    pickInternalLink: vi.fn(async () => ({ href: "nn://note/1", title: "T" })),
    lookupLink: vi.fn(async () => undefined),
    writeToClipboard: vi.fn(async () => {}),
    decryptAttachmentToTempFile: vi.fn(async (hash) => `/tmp/dec-${hash}`),
    removeTempFile: vi.fn(async () => {}),
    onError: vi.fn(),
    ...overrides
  };
  return deps;
}

describe("link data and clipboard", () => {
  test("getLinkData asks the app what an internal link points to", async () => {
    const deps = makeDeps({
      lookupLink: vi.fn(async () => ({ type: "note" as const, title: "Plan" }))
    });
    const data = await createEditorHostActions(deps).getLinkData!(
      "nn://note/1"
    );
    expect(deps.lookupLink).toHaveBeenCalledWith("nn://note/1");
    expect(data).toEqual({ type: "note", title: "Plan" });
  });

  test("getLinkData is undefined for a link that is not internal", async () => {
    const data = await createEditorHostActions(makeDeps()).getLinkData!(
      "https://notesnook.com"
    );
    expect(data).toBeUndefined();
  });

  test("copyToClipboard writes text and html", async () => {
    const deps = makeDeps();
    await createEditorHostActions(deps).copyToClipboard!("a", "<b>a</b>");
    expect(deps.writeToClipboard).toHaveBeenCalledWith("a", "<b>a</b>");
  });

  test("copyToClipboard reports a failure instead of throwing", async () => {
    const deps = makeDeps({
      writeToClipboard: vi.fn(async () => {
        throw new Error("denied");
      })
    });
    await createEditorHostActions(deps).copyToClipboard!("a");
    expect(deps.onError).toHaveBeenCalledWith("denied");
  });
});

describe("pathFromFileUrl", () => {
  test("decodes unix and windows file urls", () => {
    expect(pathFromFileUrl("file:///a/b%20c.txt")).toBe("/a/b c.txt");
    expect(pathFromFileUrl("file:///C:/x/y.txt")).toBe("C:/x/y.txt");
    expect(pathFromFileUrl("https://x.com")).toBeUndefined();
  });
});

describe("openLink", () => {
  test("internal links stay in the app", async () => {
    const deps = makeDeps({ openInternalLink: vi.fn(() => true) });
    await createEditorHostActions(deps).openLink!("nn://note/1", true);
    expect(deps.openInternalLink).toHaveBeenCalledWith("nn://note/1", true);
    expect(deps.openUrl).not.toHaveBeenCalled();
  });

  test("web links go to the system browser", async () => {
    const deps = makeDeps();
    await createEditorHostActions(deps).openLink!("https://notesnook.com");
    expect(deps.openUrl).toHaveBeenCalledWith("https://notesnook.com");
  });

  test("file links open the path", async () => {
    const deps = makeDeps();
    await createEditorHostActions(deps).openLink!("file:///tmp/a%20b.pdf");
    expect(deps.openPath).toHaveBeenCalledWith("/tmp/a b.pdf");
  });

  test("refuses script and other unsafe protocols and malformed urls", async () => {
    const deps = makeDeps();
    const host = createEditorHostActions(deps);
    await host.openLink!("javascript:alert(1)");
    await host.openLink!("not a url");
    expect(deps.openUrl).not.toHaveBeenCalled();
    expect(deps.openPath).not.toHaveBeenCalled();
  });
});

describe("attachments", () => {
  test("download and preview pass the hash on", async () => {
    const deps = makeDeps();
    const host = createEditorHostActions(deps);
    await host.downloadAttachment!({ hash: "h1" });
    await host.previewAttachment!({ hash: "h2", type: "image" });
    expect(deps.saveAttachment).toHaveBeenCalledWith("h1");
    expect(deps.previewAttachment).toHaveBeenCalledWith({
      hash: "h2",
      type: "image"
    });
  });

  test("the picker asks for images or any file, and only when allowed", async () => {
    const deps = makeDeps();
    const host = createEditorHostActions(deps);
    await host.openAttachmentPicker!("image");
    await host.openAttachmentPicker!("file");
    expect(deps.pickAndAttach).toHaveBeenNthCalledWith(1, "image/*");
    expect(deps.pickAndAttach).toHaveBeenNthCalledWith(2, "*/*");

    const blocked = makeDeps({ canAttach: vi.fn(() => false) });
    await createEditorHostActions(blocked).openAttachmentPicker!("file");
    expect(blocked.pickAndAttach).not.toHaveBeenCalled();
  });

  test("createInternalLink returns what the linking dialog picked", async () => {
    const deps = makeDeps();
    const host = createEditorHostActions(deps);
    const attributes = { href: "nn://note/0" };
    expect(await host.createInternalLink!(attributes)).toEqual({
      href: "nn://note/1",
      title: "T"
    });
    expect(deps.pickInternalLink).toHaveBeenCalledWith(attributes);
  });

  test("pasted files are attached; none or not allowed is a no-op", async () => {
    const deps = makeDeps();
    const host = createEditorHostActions(deps);
    const file = {
      name: "a.png",
      size: 1,
      type: "image/png",
      uri: "x",
      text: async () => "",
      bytes: async () => new Uint8Array()
    };
    await host.pasteFiles!([file]);
    await host.pasteFiles!([]);
    expect(deps.attachFiles).toHaveBeenCalledTimes(1);
    expect(deps.attachFiles).toHaveBeenCalledWith([file]);

    const blocked = makeDeps({ canAttach: vi.fn(() => false) });
    await createEditorHostActions(blocked).pasteFiles!([file]);
    expect(blocked.attachFiles).not.toHaveBeenCalled();
  });
});

describe("resolveAttachmentPath", () => {
  test("answers with the decrypted path and decrypts a hash once", async () => {
    const deps = makeDeps();
    const host = createEditorHostActions(deps);
    const [a, b] = await Promise.all([
      host.resolveAttachmentPath!("h1"),
      host.resolveAttachmentPath!("h1")
    ]);
    expect(a).toBe("/tmp/dec-h1");
    expect(b).toBe("/tmp/dec-h1");
    expect(deps.decryptAttachmentToTempFile).toHaveBeenCalledTimes(1);
  });

  test("a failure is reported, answers undefined and is retried next time", async () => {
    const decrypt = vi
      .fn<HostActionDeps["decryptAttachmentToTempFile"]>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("/tmp/ok");
    const deps = makeDeps({ decryptAttachmentToTempFile: decrypt });
    const host = createEditorHostActions(deps);
    expect(await host.resolveAttachmentPath!("h")).toBeUndefined();
    expect(deps.onError).toHaveBeenCalledWith("boom");
    expect(await host.resolveAttachmentPath!("h")).toBe("/tmp/ok");
  });

  test("a missing attachment answers undefined", async () => {
    const deps = makeDeps({
      decryptAttachmentToTempFile: vi.fn(async () => undefined)
    });
    expect(
      await createEditorHostActions(deps).resolveAttachmentPath!("gone")
    ).toBeUndefined();
  });

  test("dispose deletes every temporary file it handed out", async () => {
    const deps = makeDeps();
    const host = createEditorHostActions(deps);
    await host.resolveAttachmentPath!("a");
    await host.resolveAttachmentPath!("b");
    await host.dispose();
    expect(deps.removeTempFile).toHaveBeenCalledWith("/tmp/dec-a");
    expect(deps.removeTempFile).toHaveBeenCalledWith("/tmp/dec-b");
    expect(deps.removeTempFile).toHaveBeenCalledTimes(2);
  });
});
