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

import { describe, expect, test } from "vitest";
import { createEditor, h } from "../../../../test-utils";
import { Link, linkRegex } from "../link";

const input = [
  {
    text: "[Example](https://www.google.com)",
    expected: ["[Example](https://www.google.com)"]
  },
  {
    text: "[Example](https://www.example1.com) and [Example2](https://www.example2.com)",
    expected: [
      "[Example](https://www.example1.com)",
      "[Example2](https://www.example2.com)"
    ]
  },
  {
    text: "[]()",
    expected: null
  },
  {
    text: "[] [Link](http://example.com)",
    expected: ["[Link](http://example.com)"]
  },
  {
    text: "[not a link] [Link](http://example.com)",
    expected: ["[Link](http://example.com)"]
  },
  {
    text: "[NoLink]",
    expected: null
  }
];

input.forEach(({ text, expected }, i) => {
  test(`link regex ${text}`, () => {
    const result = text.match(linkRegex);
    expect(result).toEqual(expected);
  });
});

describe("paste text", () => {
  test("with markdown link", async () => {
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      extensions: {
        link: Link
      }
    });

    const clipboardEvent = new Event("paste", {
      bubbles: true,
      cancelable: true,
      composed: true
    });

    (clipboardEvent as unknown as any)["clipboardData"] = {
      getData: (type: string) =>
        type === "text/plain" ? "[test](example.com)" : undefined
    };

    editor.view.dom.dispatchEvent(clipboardEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(editorElement.outerHTML).toMatchSnapshot();
  });

  test("with multiple markdown links", async () => {
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      extensions: {
        link: Link
      }
    });

    const clipboardEvent = new Event("paste", {
      bubbles: true,
      cancelable: true,
      composed: true
    });

    (clipboardEvent as unknown as any)["clipboardData"] = {
      getData: (type: string) =>
        type === "text/plain"
          ? "[test](example.com) some text [test2](example2.com)"
          : undefined
    };

    editor.view.dom.dispatchEvent(clipboardEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(editorElement.outerHTML).toMatchSnapshot();
  });

  test("with html link", async () => {
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      extensions: {
        link: Link
      }
    });

    const clipboardEvent = new Event("paste", {
      bubbles: true,
      cancelable: true,
      composed: true
    });

    (clipboardEvent as unknown as any)["clipboardData"] = {
      getData: (type: string) =>
        type === "text/html"
          ? `<meta charset='utf-8'><html><head></head><body><a href="nn://note/68798972093c8c6ea22efca2">example.py</a></body></html>`
          : ""
    };

    editor.view.dom.dispatchEvent(clipboardEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(editorElement.outerHTML).toMatchSnapshot();
  });
});

describe("input rule", () => {
  function typeText(
    editor: ReturnType<typeof createEditor>["editor"],
    text: string
  ) {
    for (const char of text) {
      const { from, to } = editor.state.selection;
      const handled = editor.view.someProp("handleTextInput", (f) =>
        f(editor.view, from, to, char)
      );
      if (!handled) editor.commands.insertContent(char);
    }
  }

  function getLinks(editor: ReturnType<typeof createEditor>["editor"]) {
    const links: { text: string; href: string }[] = [];
    editor.state.doc.descendants((node) => {
      const link = node.marks.find((mark) => mark.type.name === "link");
      if (link && node.text)
        links.push({ text: node.text, href: link.attrs.href });
    });
    return links;
  }

  test("sets href on every typed markdown link", () => {
    const { editor } = createEditor({
      extensions: {
        link: Link
      }
    });

    typeText(editor, "[first](https://example.com/first-link) ");
    typeText(editor, "[second](https://example.com/2)");

    expect(getLinks(editor)).toEqual([
      { text: "first", href: "https://example.com/first-link" },
      { text: "second", href: "https://example.com/2" }
    ]);
    expect(editor.getText()).toBe("first second");
  });
});
