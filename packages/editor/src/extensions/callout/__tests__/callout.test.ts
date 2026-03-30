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

import { test, expect } from "vitest";
import { createEditor, h } from "../../../../test-utils/index.js";
import { Callout } from "../callout.js";
import { Heading } from "../../heading/heading.js";

test("ctrl+space should collapse/expand callout when cursor is in first heading", async () => {
  const el = h("div", [
    h("div", [h("h4", ["INFO"]), h("p", ["This is the callout content."])], {
      class: "callout",
      "data-callout-type": "info"
    })
  ]);
  const { editor } = createEditor({
    extensions: {
      callout: Callout,
      heading: Heading.configure({ levels: [1, 2, 3, 4, 5, 6] })
    },
    initialContent: el.outerHTML
  });

  editor.commands.setTextSelection(3);
  const collapseEvent = new KeyboardEvent("keydown", {
    key: " ",
    code: "Space",
    ctrlKey: true,
    bubbles: true
  });
  editor.view.dom.dispatchEvent(collapseEvent);

  expect(editor.getHTML()).toMatchSnapshot();

  const expandEvent = new KeyboardEvent("keydown", {
    key: " ",
    code: "Space",
    ctrlKey: true,
    bubbles: true
  });
  editor.view.dom.dispatchEvent(expandEvent);

  expect(editor.getHTML()).toMatchSnapshot();
});
