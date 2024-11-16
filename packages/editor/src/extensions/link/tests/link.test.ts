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
});
