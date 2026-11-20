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
import { q } from "../queries.js";
import { createRemoteQueryStore } from "../remote-store.js";
import { createController } from "../../controller.js";
import { toController } from "../../tiptap-controller.js";

const tick = () => new Promise((resolve) => queueMicrotask(() => resolve(0)));

describe("remote query store", () => {
  test("sends the subscribed queries once per change of the set", async () => {
    const send = vi.fn();
    const store = createRemoteQueryStore(send);
    const off1 = store.subscribe(q.isActive("bold"), () => {});
    const off2 = store.subscribe(q.isActive("bold"), () => {});
    store.subscribe(q.history(), () => {});
    await tick();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toEqual([
      { key: q.isActive("bold").key, kind: "isActive", args: ["bold"] },
      { key: q.history().key, kind: "history", args: [] }
    ]);
    off1();
    await tick();
    expect(send).toHaveBeenCalledTimes(1);
    off2();
    await tick();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toEqual([
      { key: q.history().key, kind: "history", args: [] }
    ]);
  });

  test("notifies only the queries whose value changed", async () => {
    const store = createRemoteQueryStore(() => {});
    const bold = vi.fn();
    const italic = vi.fn();
    store.subscribe(q.isActive("bold"), bold);
    store.subscribe(q.isActive("italic"), italic);
    store.apply({
      [q.isActive("bold").key]: true,
      [q.isActive("italic").key]: false
    });
    expect(store.read(q.isActive("bold"))).toBe(true);
    bold.mockClear();
    italic.mockClear();
    store.apply({ [q.isActive("bold").key]: false });
    expect(bold).toHaveBeenCalledTimes(1);
    expect(italic).not.toHaveBeenCalled();
    store.apply({ [q.isActive("bold").key]: false, unknown: 1 });
    expect(bold).toHaveBeenCalledTimes(1);
  });

  test("maps native anchors to rects and node targets to the node argument", () => {
    const send = vi.fn();
    const store = createRemoteQueryStore(send);
    const anchor = q.anchor({ node: "image" });
    store.subscribe(anchor, () => {});
    expect(store.active()).toEqual([
      { key: anchor.key, kind: "anchor", args: ["node"] }
    ]);
    store.apply({ [anchor.key]: { x: 10, y: 20, width: 30, height: 40 } });
    expect(store.read(anchor)).toEqual({
      top: 20,
      left: 10,
      right: 40,
      bottom: 60
    });
  });
});

describe("editor controller", () => {
  test("runs a batch of commands through the host", () => {
    const run = vi.fn();
    const controller = createController({
      queries: createRemoteQueryStore(() => {}),
      run
    });
    expect(toController(controller)).toBe(controller);
    controller.run({ name: "toggleBold" }, { name: "setColor", args: ["red"] });
    expect(run).toHaveBeenCalledWith([
      { name: "toggleBold" },
      { name: "setColor", args: ["red"] }
    ]);
  });
});
