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

import { describe, expect, it, vi } from "vitest";
import {
  createAutoSaveGuard,
  deniedPermissionIds,
  dispatchQueryResults,
  setDeniedPermissionsCommand,
  focusPlan,
  routeHostAction,
  takeContent,
  wordCount
} from "./editor-bridge";

describe("dispatchQueryResults", () => {
  it("calls only the callbacks whose keys changed", () => {
    const cb = {
      onSelectionChange: vi.fn(),
      onUndoRedoChange: vi.fn(),
      onStatisticsChange: vi.fn(),
      onHeadingsChange: vi.fn()
    };
    const selection = dispatchQueryResults(
      { selection: { from: 2, to: 5 } },
      cb
    );
    expect(selection).toEqual({ from: 2, to: 5 });
    expect(cb.onSelectionChange).toHaveBeenCalledWith({ from: 2, to: 5 });
    expect(cb.onUndoRedoChange).not.toHaveBeenCalled();
    expect(cb.onHeadingsChange).not.toHaveBeenCalled();
  });

  it("maps history and headings", () => {
    const cb = { onUndoRedoChange: vi.fn(), onHeadingsChange: vi.fn() };
    dispatchQueryResults(
      {
        history: { canUndo: true },
        headings: [{ level: 2, title: "Hi", id: "h1" }]
      },
      cb
    );
    expect(cb.onUndoRedoChange).toHaveBeenCalledWith({
      canUndo: true,
      canRedo: false
    });
    expect(cb.onHeadingsChange).toHaveBeenCalledWith([
      { level: 2, title: "Hi", id: "h1" }
    ]);
  });

  it("ignores malformed values", () => {
    const cb = { onSelectionChange: vi.fn(), onHeadingsChange: vi.fn() };
    expect(
      dispatchQueryResults({ selection: "x", headings: 3 }, cb)
    ).toBeUndefined();
    expect(cb.onSelectionChange).not.toHaveBeenCalled();
    expect(cb.onHeadingsChange).not.toHaveBeenCalled();
  });
});

describe("auto save guard", () => {
  it("disables saving at the word limit and re-enables it below", () => {
    const guard = createAutoSaveGuard(100);
    expect(guard.update(99)).toBe(false);
    expect(guard.enabled).toBe(true);
    expect(guard.update(100)).toBe(true);
    expect(guard.enabled).toBe(false);
    expect(guard.update(10)).toBe(false);
    expect(guard.enabled).toBe(true);
  });

  it("treats an unknown or zero count as small, and reset re-enables", () => {
    const guard = createAutoSaveGuard(100);
    expect(guard.update(undefined)).toBe(false);
    expect(guard.update(0)).toBe(false);
    guard.update(500);
    guard.reset();
    expect(guard.enabled).toBe(true);
  });

  it("reads the word count from a statistics result only", () => {
    expect(wordCount({ statistics: { words: { total: 12 } } })).toBe(12);
    expect(wordCount({ selection: { from: 1, to: 2 } })).toBeUndefined();
    expect(wordCount({ statistics: { words: "x" } })).toBeUndefined();
    expect(wordCount({ statistics: 3 })).toBeUndefined();
  });
});

describe("focusPlan", () => {
  it("restores a saved selection and keeps it", () => {
    expect(focusPlan({ from: 4, to: 9 })).toEqual({
      commands: [{ name: "setTextSelection", args: [{ from: 4, to: 9 }] }],
      selection: { from: 4, to: 9 },
      focus: "end"
    });
  });

  it("only focuses for a named position, defaulting to the end", () => {
    expect(focusPlan("start")).toEqual({
      commands: [],
      selection: undefined,
      focus: "start"
    });
    expect(focusPlan().focus).toBe("end");
  });
});

describe("routeHostAction", () => {
  const files = [{ name: "a.png" }] as never[];

  it("sends pasted files to onAttachFiles, not the host", () => {
    const host = { pasteFiles: vi.fn() };
    const onAttachFiles = vi.fn();
    expect(
      routeHostAction(
        { kind: "pasteFiles", payload: { files } },
        { host, onAttachFiles }
      )
    ).toBe(true);
    expect(onAttachFiles).toHaveBeenCalledWith(files);
    expect(host.pasteFiles).not.toHaveBeenCalled();
  });

  it("falls back to the host when there is no onAttachFiles", () => {
    const host = { pasteFiles: vi.fn() };
    routeHostAction({ kind: "pasteFiles", payload: { files } }, { host });
    expect(host.pasteFiles).toHaveBeenCalledWith(files);
  });

  it("ignores empty pastes and unknown actions", () => {
    const onAttachFiles = vi.fn();
    expect(
      routeHostAction(
        { kind: "pasteFiles", payload: { files: [] } },
        { onAttachFiles }
      )
    ).toBe(false);
    expect(routeHostAction({ kind: "nope", payload: null }, {})).toBe(false);
    expect(onAttachFiles).not.toHaveBeenCalled();
  });

  it("previews through the host, or the surface callback without one", () => {
    const host = { previewAttachment: vi.fn() };
    routeHostAction(
      { kind: "previewAttachment", payload: { hash: "h", type: "pdf" } },
      { host }
    );
    expect(host.previewAttachment).toHaveBeenCalledWith({
      hash: "h",
      type: "pdf"
    });
    const onPreviewDocument = vi.fn();
    routeHostAction(
      { kind: "previewAttachment", payload: { hash: "h2" } },
      { onPreviewDocument }
    );
    expect(onPreviewDocument).toHaveBeenCalledWith("h2");
  });

  it("opens links and the picker with their defaults", () => {
    const host = { openLink: vi.fn(), openAttachmentPicker: vi.fn() };
    routeHostAction(
      { kind: "openLink", payload: { url: "https://a.b", openInNewTab: true } },
      { host }
    );
    expect(host.openLink).toHaveBeenCalledWith("https://a.b", true);
    routeHostAction({ kind: "openAttachmentPicker", payload: {} }, { host });
    expect(host.openAttachmentPicker).toHaveBeenCalledWith("image");
    routeHostAction(
      { kind: "openAttachmentPicker", payload: { type: "file" } },
      { host }
    );
    expect(host.openAttachmentPicker).toHaveBeenLastCalledWith("file");
    expect(routeHostAction({ kind: "openLink", payload: {} }, { host })).toBe(
      false
    );
  });
});

describe("takeContent", () => {
  it("prefers unsaved content once, then falls back to the source", () => {
    const unsaved = { current: "<p>typed</p>" as string | undefined };
    const source = () => "<p>stored</p>";
    expect(takeContent(unsaved, source)).toBe("<p>typed</p>");
    expect(takeContent(unsaved, source)).toBe("<p>stored</p>");
  });

  it("returns an empty string when there is no content", () => {
    expect(takeContent({ current: undefined }, () => undefined)).toBe("");
  });
});

describe("denied permissions", () => {
  const all = {
    callout: true,
    outlineList: true,
    taskList: true,
    insertAttachment: true
  };

  it("denies nothing when the plan allows everything", () => {
    expect(deniedPermissionIds(all)).toEqual([]);
  });

  it("denies exactly the features the plan lacks, by command id", () => {
    expect(
      deniedPermissionIds({ ...all, callout: false, taskList: false })
    ).toEqual(["setCallout", "toggleTaskList"]);
    expect(
      deniedPermissionIds({
        callout: false,
        outlineList: false,
        taskList: false,
        insertAttachment: false
      })
    ).toEqual([
      "setCallout",
      "toggleOutlineList",
      "toggleTaskList",
      "insertAttachment"
    ]);
  });

  it("builds the setDeniedPermissions command, empty list included", () => {
    expect(setDeniedPermissionsCommand(["setCallout"])).toEqual({
      name: "setDeniedPermissions",
      payload: { ids: ["setCallout"] }
    });
    expect(setDeniedPermissionsCommand([]).payload.ids).toEqual([]);
  });
});
