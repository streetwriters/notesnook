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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, Root } from "react-dom/client";
import { EmotionThemeProvider } from "@notesnook/theme";
import { createEditor } from "../../test-utils/index.js";
import { Toolbar } from "@notesnook/editor-ui";

// Counts every render of a tool's ToolButton element. A tool that re-renders
// produces a new ToolButton element, so a non-memoised wrapper sees it even
// when the real (memoised) button would skip the DOM work.
const counts = vi.hoisted(() => new Map<string, number>());
vi.mock("@notesnook/editor-ui/toolbar/components/tool-button.js", async (importOriginal) => {
  const original = await importOriginal<{
    ToolButton: (props: never) => unknown;
  }>();
  const { createElement: h } = await import("react");
  return {
    ...original,
    ToolButton: (props: { id?: string; icon: string }) => {
      const key = props.id || props.icon;
      counts.set(key, (counts.get(key) || 0) + 1);
      return h(original.ToolButton, props as never);
    }
  };
});

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
beforeEach(() => counts.clear());
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
});

function renderToolbar(html: string, selection: { from: number; to: number }) {
  const { editor } = createEditor({ extensions: {}, initialContent: html });
  editor.commands.setTextSelection(selection);
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      createElement(
        EmotionThemeProvider,
        { scope: "editorToolbar" },
        createElement(Toolbar, {
          editor,
          location: "top",
          tools: [["bold", "italic", "underline"]],
          defaultFontFamily: "sans-serif",
          defaultFontSize: 16
        })
      )
    )
  );
  return { editor };
}

function snapshot() {
  return Object.fromEntries(counts);
}

describe("toolbar render counts", () => {
  test("mounts each tool", () => {
    renderToolbar("<p>one</p><p>two</p>", { from: 1, to: 1 });
    const mounted = snapshot();
    expect(Object.keys(mounted).sort()).toEqual([
      "bold",
      "italic",
      "underline"
    ]);
    for (const count of Object.values(mounted))
      expect(count).toBeLessThanOrEqual(2);
  });

  test("moving the caret between two plain paragraphs re-renders no tool", () => {
    const { editor } = renderToolbar("<p>one</p><p>two</p>", {
      from: 1,
      to: 1
    });
    const before = snapshot();

    act(() => {
      editor.commands.setTextSelection(6);
    });
    act(() => {
      editor.commands.setTextSelection(2);
    });

    expect(snapshot()).toEqual(before);
  });

  test("toggling bold re-renders only the bold tool", () => {
    const { editor } = renderToolbar("<p>hello world</p>", {
      from: 1,
      to: 6
    });
    const before = snapshot();

    act(() => {
      editor.commands.toggleBold();
    });

    const after = snapshot();
    expect(after.bold).toBeGreaterThan(before.bold);
    expect(after.italic).toBe(before.italic);
    expect(after.underline).toBe(before.underline);
    // one transaction, at most one extra render of the bold tool
    expect(after.bold - before.bold).toBeLessThanOrEqual(1);
  });
});
