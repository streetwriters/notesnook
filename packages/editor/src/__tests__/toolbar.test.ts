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

import { afterEach, describe, expect, test } from "vitest";
import { act, createElement } from "react";
import { createRoot, Root } from "react-dom/client";
import { EmotionThemeProvider } from "@notesnook/theme";
import { createEditor } from "../../test-utils/index.js";
import { Toolbar } from "@notesnook/editor-ui";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
});

function renderToolbar() {
  const { editor } = createEditor({
    extensions: {},
    initialContent: "<p>hello world</p>"
  });
  editor.commands.setTextSelection({ from: 1, to: 6 });
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
          tools: [["bold", "italic"]],
          defaultFontFamily: "sans-serif",
          defaultFontSize: 16
        })
      )
    )
  );
  const button = (id: string) => {
    const element = container.querySelector<HTMLButtonElement>(`#tool-${id}`);
    if (!element) throw new Error(`tool ${id} is not rendered`);
    return element;
  };
  return { editor, button };
}

describe("toolbar", () => {
  test("reflects editor state without the editor host re-rendering", () => {
    const { editor, button } = renderToolbar();
    const bold = button("bold").className;
    const italic = button("italic").className;

    act(() => {
      editor.commands.toggleBold();
    });

    expect(button("bold").className).not.toBe(bold);
    expect(button("italic").className).toBe(italic);
  });

  test("runs commands through the controller", () => {
    const { editor, button } = renderToolbar();
    act(() => button("italic").click());
    expect(editor.isActive("italic")).toBe(true);
  });
});
