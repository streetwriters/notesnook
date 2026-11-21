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
  adaptEvents,
  createHandle,
  type NativeCommands
} from "../../../../../../packages/editor-native/src/adapter";
import { createController } from "@notesnook/editor-ui/controller.js";
import { createRemoteQueryStore } from "@notesnook/editor-ui/queries/remote-store.js";
import { q } from "@notesnook/editor-ui/queries/queries.js";

// The editor surface wires the toolbar's `EditorController` to the native
// editor through `createHandle`/`adaptEvents` (`@notesnook/editor-native`).
// This runs that wiring against a fake native view: what the toolbar asks for
// must reach the view as the JSON it expects, and what the view reports must
// reach the toolbar.

type Ref = { id: string };
const view: Ref = { id: "view" };

function fakeCommands() {
  return {
    run: vi.fn(),
    setQueries: vi.fn(),
    focus: vi.fn(),
    setContent: vi.fn(),
    requestSave: vi.fn(),
    attachmentReady: vi.fn()
  } satisfies NativeCommands<Ref>;
}

const tick = () => new Promise((resolve) => queueMicrotask(() => resolve(0)));

describe("editor-native adapter", () => {
  it("sends controller commands and subscribed queries to the native view", async () => {
    const commands = fakeCommands();
    const handle = createHandle(() => view, commands);
    const queries = createRemoteQueryStore((active) =>
      handle.setQueries(active)
    );
    const controller = createController({
      queries,
      run: (batch) => handle.run(batch)
    });

    controller.run({ name: "toggleBold" }, { name: "setColor", args: ["red"] });
    expect(commands.run).toHaveBeenCalledWith(
      view,
      JSON.stringify([
        { name: "toggleBold" },
        { name: "setColor", args: ["red"] }
      ])
    );

    queries.subscribe(q.isActive("bold"), () => {});
    await tick();
    expect(commands.setQueries).toHaveBeenCalledTimes(1);
    expect(JSON.parse(commands.setQueries.mock.calls[0][1])).toEqual([
      { key: q.isActive("bold").key, kind: "isActive", args: ["bold"] }
    ]);
  });

  it("delivers query results from the native view to subscribers", () => {
    const queries = createRemoteQueryStore(() => {});
    const listener = vi.fn();
    queries.subscribe(q.isActive("bold"), listener);
    const events = adaptEvents({
      onQueryResults: ({ changed }) => queries.apply(changed)
    });
    events.onQueryResults!({
      nativeEvent: {
        revision: 1,
        changed: JSON.stringify({ [q.isActive("bold").key]: true })
      }
    });
    expect(queries.read(q.isActive("bold"))).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("drops commands while the native view is not mounted", () => {
    const commands = fakeCommands();
    const handle = createHandle<Ref>(() => null, commands);
    handle.run({ name: "undo" });
    handle.setQueries([]);
    handle.focus();
    handle.setContent("<p>x</p>");
    handle.requestSave();
    handle.attachmentReady(1, "/tmp/a");
    for (const command of Object.values(commands))
      expect(command).not.toHaveBeenCalled();
  });

  it("encodes content, focus and attachment answers", () => {
    const commands = fakeCommands();
    const handle = createHandle(() => view, commands);
    handle.setContent("<p>hi</p>");
    handle.focus();
    handle.focus("start");
    handle.requestSave();
    handle.attachmentReady(7, "/tmp/a.png");
    handle.attachmentReady(8, null);
    expect(commands.setContent).toHaveBeenCalledWith(view, "<p>hi</p>");
    expect(commands.focus.mock.calls).toEqual([
      [view, "end"],
      [view, "start"]
    ]);
    expect(commands.requestSave).toHaveBeenCalledWith(view);
    // A missing path reaches the native side as an empty string: "unreadable".
    expect(commands.attachmentReady.mock.calls).toEqual([
      [view, 7, "/tmp/a.png"],
      [view, 8, ""]
    ]);
  });

  it("decodes events and leaves unhandled events off", () => {
    const onHostAction = vi.fn();
    const onAttachmentRequest = vi.fn();
    const onSave = vi.fn();
    const events = adaptEvents({ onHostAction, onAttachmentRequest, onSave });
    expect(events.onQueryResults).toBeUndefined();
    expect(events.onContentChange).toBeUndefined();

    events.onHostAction!({
      nativeEvent: { kind: "openLink", payload: '{"url":"https://a.b"}' }
    });
    expect(onHostAction).toHaveBeenCalledWith({
      kind: "openLink",
      payload: { url: "https://a.b" }
    });
    // A payload that is not JSON arrives as undefined, not as a throw.
    events.onHostAction!({ nativeEvent: { kind: "x", payload: "{oops" } });
    expect(onHostAction).toHaveBeenLastCalledWith({
      kind: "x",
      payload: undefined
    });

    events.onAttachmentRequest!({
      nativeEvent: { id: 3, hash: "abc", mime: "", url: "" }
    });
    expect(onAttachmentRequest).toHaveBeenCalledWith({
      id: 3,
      hash: "abc",
      mime: undefined,
      url: undefined
    });

    events.onSave!({ nativeEvent: { revision: 2, html: "<p>a</p>" } });
    expect(onSave).toHaveBeenCalledWith({ revision: 2, html: "<p>a</p>" });
  });

  it("treats a malformed query result as no change", () => {
    const onQueryResults = vi.fn();
    adaptEvents({ onQueryResults }).onQueryResults!({
      nativeEvent: { revision: 5, changed: "not json" }
    });
    expect(onQueryResults).toHaveBeenCalledWith({ revision: 5, changed: {} });
  });
});
