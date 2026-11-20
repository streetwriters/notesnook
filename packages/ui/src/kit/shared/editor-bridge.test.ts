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
import { dispatchQueryResults, takeContent } from "./editor-bridge";

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
