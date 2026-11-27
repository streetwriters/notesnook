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

// The toolbar's popups on the web target of @notesnook/ui-kit, as apps/web
// draws them: typed text reaches them through DOM `onChange` events and Enter
// through `onKeyDown`.

import { afterEach, describe, expect, test } from "vitest";
import { act, createElement } from "react";
import { createRoot, Root } from "react-dom/client";
import { EmotionThemeProvider } from "@notesnook/theme";
import { Editor } from "@tiptap/core";
import { createEditor } from "../../test-utils/index.js";
import { Toolbar, type ToolbarDefinition } from "@notesnook/editor-ui";
import { Link } from "../extensions/link/index.js";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
const editors: Editor[] = [];
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  for (const editor of editors.splice(0))
    if (!editor.isDestroyed) editor.destroy();
  document.body.innerHTML = "";
});

function renderToolbar(tools: ToolbarDefinition) {
  const { editor } = createEditor({
    extensions: { link: Link },
    initialContent: "<p>hello world</p>"
  });
  editors.push(editor);
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
          tools,
          defaultFontFamily: "sans-serif",
          defaultFontSize: 16
        })
      )
    )
  );
  return editor;
}

function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`${selector} is not rendered`);
  act(() => element.click());
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function press(input: HTMLElement, key: string) {
  act(() => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

function input(placeholder: string) {
  const element = document.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`
  );
  if (!element) throw new Error(`no input with placeholder ${placeholder}`);
  return element;
}

describe("toolbar popups on the web kit", () => {
  test("the link popup reads typed text and inserts the link on Enter", () => {
    const editor = renderToolbar([["addLink"]]);
    click("#tool-link");

    const url = input("https://example.com/");
    type(url, "https://notesnook.com");
    press(url, "Enter");

    expect(editor.isActive("link")).toBe(true);
    expect(editor.getHTML()).toContain('href="https://notesnook.com/"');
    expect(
      document.querySelector('input[placeholder="https://example.com/"]')
    ).toBeNull();
  });

  test("the link popup shows an error for an invalid URL and keeps the text", () => {
    const editor = renderToolbar([["addLink"]]);
    click("#tool-link");

    const url = input("https://example.com/");
    type(url, "not a url");
    press(url, "Enter");

    expect(editor.isActive("link")).toBe(false);
    expect(input("https://example.com/").value).toBe("not a url");
  });

  test("the link popup's action button applies the typed link text", () => {
    const editor = renderToolbar([["addLink"]]);
    click("#tool-link");

    type(input("https://example.com/"), "https://notesnook.com");
    click('[data-test-id="popup-action"]');

    expect(editor.isActive("link")).toBe(true);
  });
});
