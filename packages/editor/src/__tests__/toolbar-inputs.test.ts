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

// The editor UI's inputs and buttons on the web target of @notesnook/ui-kit:
// the search and replace fields, the image popups and tools, and the tab and
// menu buttons, driven through DOM events as apps/web drives them.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, createElement, type ReactElement } from "react";
import { createRoot, Root } from "react-dom/client";
import { EmotionThemeProvider } from "@notesnook/theme";
import { Editor } from "@tiptap/core";
import { strings } from "@notesnook/intl";
import { createEditor } from "../../test-utils/index.js";
import {
  Tab,
  Tabs,
  Toolbar,
  q,
  createController,
  tiptapController,
  useEditorSearchStore,
  useToolbarStore,
  type EditorCommand,
  type ToolbarDefinition
} from "@notesnook/editor-ui";
import { createRemoteQueryStore } from "@notesnook/editor-ui/queries/remote-store.js";
import { SearchReplacePopup } from "@notesnook/editor-ui/toolbar/popups/search-replace.js";
import { ImageUploadPopup } from "@notesnook/editor-ui/toolbar/popups/image-upload.js";
import {
  ImageAlignCenter,
  ImageAlignLeft,
  ImageAlignRight,
  ImagePropertiesPopup
} from "@notesnook/editor-ui/toolbar/tools/controller-image.js";
import { SearchReplace } from "../extensions/search-replace/index.js";

const downloadImage = vi.hoisted(() => vi.fn());
vi.mock("@notesnook/editor-ui/utils/downloader.js", async (original) => ({
  ...(await original<object>()),
  downloadImage,
  toDataURL: async () => "data:image/png;base64,AAAA"
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
const editors: Editor[] = [];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  for (const editor of editors.splice(0))
    if (!editor.isDestroyed) editor.destroy();
  useEditorSearchStore.setState({
    searchTerm: "",
    replaceTerm: "",
    isReplacing: false,
    isExpanded: false,
    isSearching: false
  });
  useToolbarStore.getState().setIsMobile(false);
  document.body.innerHTML = "";
  downloadImage.mockReset();
  vi.useRealTimers();
});

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      createElement(EmotionThemeProvider, { scope: "editorToolbar" }, element)
    )
  );
}

function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`${selector} is not rendered`);
  act(() => element.click());
}

function clickButton(title: string) {
  const element = Array.from(
    document.querySelectorAll<HTMLElement>("button")
  ).find((button) => button.textContent === title);
  if (!element) throw new Error(`no button titled ${title}`);
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

function press(input: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, ...init })
    );
  });
}

function input(placeholder: string) {
  const element = Array.from(document.querySelectorAll("input")).find(
    (item) => item.placeholder === placeholder
  );
  if (!element) throw new Error(`no input with placeholder ${placeholder}`);
  return element;
}

describe("search and replace popup", () => {
  function renderSearch(html: string) {
    const { editor } = createEditor({
      extensions: { searchReplace: SearchReplace },
      initialContent: html
    });
    editors.push(editor);
    render(createElement(SearchReplacePopup, { editor }));
    return editor;
  }

  const counter = () => document.body.textContent?.match(/\d+\/\d+/)?.[0];

  test("typing in the search field finds the matches and shows their count", () => {
    renderSearch("<p>one two one two one</p>");
    expect(counter()).toBe("0/0");

    type(input(strings.search()), "one");
    // the search runs 100ms after the last keystroke
    act(() => vi.advanceTimersByTime(100));

    expect(useEditorSearchStore.getState().searchTerm).toBe("one");
    expect(counter()).toBe("1/3");
  });

  test("Enter in the search field moves to the next match, Shift+Enter back", () => {
    renderSearch("<p>one two one two one</p>");
    const search = input(strings.search());
    type(search, "one");
    act(() => vi.advanceTimersByTime(100));

    press(search, "Enter");
    expect(counter()).toBe("2/3");
    press(search, "Enter");
    expect(counter()).toBe("3/3");
    press(search, "Enter", { shiftKey: true });
    expect(counter()).toBe("2/3");
  });

  test("the replace field is typed into and replaces the match", () => {
    const editor = renderSearch("<p>one two one</p>");
    type(input(strings.search()), "one");
    act(() => vi.advanceTimersByTime(100));
    expect(
      Array.from(document.querySelectorAll("input")).some(
        (item) => item.placeholder === strings.replace()
      )
    ).toBe(false);

    click('[data-test-id="tool-toggleReplace"]');
    type(input(strings.replace()), "three");
    expect(useEditorSearchStore.getState().replaceTerm).toBe("three");

    click('[data-test-id="tool-replaceAll"]');
    expect(editor.getText()).toBe("three two three");
  });
});

describe("image tools on a controller", () => {
  function setup(image: Record<string, unknown> | null) {
    const runs: EditorCommand[][] = [];
    const store = createRemoteQueryStore(() => undefined);
    const controller = createController({
      queries: store,
      run: (commands) => runs.push(commands)
    });
    // the store only keeps values of queries something subscribes to
    const show = () =>
      act(() => store.apply({ [q.selectedNode("image").key]: image }));
    return { controller, runs, show };
  }

  const tool = { icon: "alignLeft", title: "Align" } as const;

  test("the align buttons run setImageAlignment and show the current one", () => {
    const { controller, runs, show } = setup({ align: "right", width: 100 });
    render(
      createElement(
        "div",
        null,
        createElement(ImageAlignLeft, { editor: controller, ...tool }),
        createElement(ImageAlignCenter, { editor: controller, ...tool }),
        createElement(ImageAlignRight, { editor: controller, ...tool })
      )
    );
    show();

    const buttons = document.querySelectorAll<HTMLElement>("button");
    expect(buttons).toHaveLength(3);
    act(() => buttons[1].click());
    act(() => buttons[0].click());

    expect(runs.map((commands) => commands[0].name)).toEqual([
      "setImageAlignment",
      "setImageAlignment"
    ]);
    expect(runs.map((commands) => commands[0].args)).toEqual([
      [{ align: "center" }],
      [{ align: "left" }]
    ]);
  });

  test("the align buttons are hidden when no image is selected", () => {
    const { controller, show } = setup(null);
    render(createElement(ImageAlignLeft, { editor: controller, ...tool }));
    show();
    expect(document.querySelectorAll("button")).toHaveLength(0);
  });

  test("typing a width in the properties popup resizes the image with its ratio", () => {
    const { controller, runs, show } = setup({ width: 200, height: 100 });
    render(
      createElement(ImagePropertiesPopup, {
        editor: controller,
        onClose: () => undefined
      })
    );
    show();

    const [width, height] = document.querySelectorAll<HTMLInputElement>(
      'input[type="number"]'
    );
    expect(width.value).toBe("200");
    expect(height.value).toBe("100");

    type(width, "300");
    expect(runs).toHaveLength(1);
    expect(runs[0][0].name).toBe("setImageSize");
    expect(runs[0][0].args).toEqual([{ width: 300, height: 150 }]);
    // what is being typed stays as typed
    expect(width.value).toBe("300");

    type(height, "50");
    expect(runs[1][0].args).toEqual([{ width: 100, height: 50 }]);
  });

  test("the properties popup on a Tiptap editor draws nothing without an image", () => {
    const { editor } = createEditor({
      extensions: {},
      initialContent: "<p>text</p>"
    });
    editors.push(editor);
    const controller = tiptapController(editor);
    const run = vi.spyOn(controller, "run");
    // the query store reads the editor, which has no image here
    render(
      createElement(ImagePropertiesPopup, {
        editor: controller,
        onClose: () => undefined
      })
    );
    expect(document.querySelectorAll("input")).toHaveLength(0);
    expect(run).not.toHaveBeenCalled();
  });
});

describe("image upload popup", () => {
  function renderUpload() {
    const onInsert = vi.fn();
    const onClose = vi.fn();
    render(createElement(ImageUploadPopup, { onInsert, onClose }));
    return { onInsert, onClose };
  }

  test("the insert button waits for a typed URL", () => {
    renderUpload();
    const action = document.querySelector<HTMLButtonElement>(
      '[data-test-id="popup-action"]'
    );
    expect(action?.disabled).toBe(true);

    type(input(strings.pasteImageURL()), "https://example.com/a.png");
    expect(
      document.querySelector<HTMLButtonElement>('[data-test-id="popup-action"]')
        ?.disabled
    ).toBe(false);
  });

  test("insert downloads the typed URL and hands the image to onInsert", async () => {
    downloadImage.mockResolvedValue({
      blob: new Blob(["x"], { type: "image/png" }),
      size: 1,
      mimeType: "image/png"
    });
    const { onInsert } = renderUpload();

    type(input(strings.pasteImageURL()), "https://example.com/a.png");
    click('[data-test-id="popup-action"]');
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(downloadImage.mock.calls[0][0]).toBe("https://example.com/a.png");
    expect(onInsert).toHaveBeenCalledWith({
      src: "data:image/png;base64,AAAA",
      size: 1,
      mime: "image/png"
    });
  });

  test("a failed download shows the error and typing clears it", async () => {
    downloadImage.mockRejectedValue(new Error("Network Down"));
    const { onInsert } = renderUpload();
    const url = input(strings.pasteImageURL());

    type(url, "https://example.com/a.png");
    click('[data-test-id="popup-action"]');
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onInsert).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain(
      strings.failedToDownloadImage("network down")
    );

    type(url, "https://example.com/b.png");
    expect(document.body.textContent).not.toContain(
      strings.failedToDownloadImage("network down")
    );
  });
});

describe("tabs and menu buttons", () => {
  test("a tab button's onClick shows its content and reports the index", () => {
    const onTabChanged = vi.fn();
    render(
      createElement(
        Tabs,
        { activeIndex: 0, onTabChanged },
        createElement(Tab, { title: "First" }, "first content"),
        createElement(Tab, { title: "Second" }, "second content")
      )
    );
    expect(document.body.textContent).toContain("first content");
    expect(document.body.textContent).not.toContain("second content");

    clickButton("Second");

    expect(document.body.textContent).toContain("second content");
    expect(document.body.textContent).not.toContain("first content");
    expect(onTabChanged).toHaveBeenCalledWith(1);
  });

  test("a menu item's onClick runs its editor command", () => {
    const tools: ToolbarDefinition = [["insertBlock"]];
    const { editor } = createEditor({
      extensions: {},
      initialContent: "<p>hello</p>"
    });
    editors.push(editor);
    render(
      createElement(Toolbar, {
        editor,
        location: "top",
        tools,
        defaultFontFamily: "sans-serif",
        defaultFontSize: 16
      })
    );

    click('[data-test-id="tool-insertBlock"]');
    click('[data-test-id="menu-button-hr"]');

    expect(editor.getHTML()).toContain("<hr");
  });
});
