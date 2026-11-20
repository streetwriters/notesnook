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
import { callHostAction, getHostAction, hasHostAction } from "../host.js";

describe("host actions", () => {
  test("an editor without host actions or storage has none", () => {
    expect(hasHostAction({}, "openLink")).toBe(false);
    expect(hasHostAction(undefined, "openAttachmentPicker")).toBe(false);
    expect(callHostAction({}, "openLink", "https://example.com")).toBe(false);
  });

  test("falls back to editor.storage, how Tiptap hosts supply them", () => {
    const openLink = vi.fn();
    const editor = { storage: { openLink } };
    expect(hasHostAction(editor, "openLink")).toBe(true);
    expect(callHostAction(editor, "openLink", "https://example.com")).toBe(
      true
    );
    expect(openLink).toHaveBeenCalledWith("https://example.com");
  });

  test("host actions take precedence over storage and keep their receiver", () => {
    const fromStorage = vi.fn();
    const host = {
      calls: [] as string[],
      downloadAttachment(this: { calls: string[] }, a: { hash: string }) {
        this.calls.push(a.hash);
      }
    };
    const editor = {
      hostActions: host,
      storage: { downloadAttachment: fromStorage }
    };
    callHostAction(editor, "downloadAttachment", { hash: "abc" });
    expect(host.calls).toEqual(["abc"]);
    expect(fromStorage).not.toHaveBeenCalled();
  });

  test("ignores non-function entries", () => {
    expect(
      getHostAction({ storage: { openLink: "nope" } }, "openLink")
    ).toBeUndefined();
  });

  test("resolveAttachmentPath answers with the path the host decrypted to", async () => {
    const editor = {
      hostActions: { resolveAttachmentPath: async () => "/tmp/a.png" }
    };
    await expect(
      getHostAction(editor, "resolveAttachmentPath")?.("abc")
    ).resolves.toBe("/tmp/a.png");
  });
});
