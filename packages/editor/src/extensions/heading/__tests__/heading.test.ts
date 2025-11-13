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
import { createEditor, h1, p, h } from "../../../../test-utils/index.js";
import { Heading } from "../heading.js";

test("collapse heading", () => {
  const { editor } = createEditor({
    extensions: {
      heading: Heading.configure({ levels: [1, 2, 3, 4, 5, 6] })
    },
    initialContent: `
      <h1>Main Heading</h1>
      <p>paragraph.</p>
      <h2>Subheading</h2>
      <p>subheading paragraph</p>
      <h1>Main heading 2</h1>
      <p>paragraph another</p>
    `
  });

  const headingPos = 0;

  editor.commands.command(({ tr }) => {
    tr.setNodeAttribute(headingPos, "collapsed", true);
    return true;
  });

  expect(editor.getHTML()).toMatchSnapshot("heading collapsed");

  editor.commands.command(({ tr }) => {
    tr.setNodeAttribute(headingPos, "collapsed", false);
    return true;
  });

  expect(editor.getHTML()).toMatchSnapshot("heading uncollapsed");
});

/**
 * prior to this test, empty collapsed headings were allowed, but now they are not
 * so we need to test that all such headings are migrated to uncollapsed state
 */
test("collapsed empty heading should uncollapse", async () => {
  const el = h("div", [
    h1([""], { "data-collapsed": "true" }),
    p(["Some paragraph"], { "data-hidden": "true" })
  ]);
  const { editor } = createEditor({
    initialContent: el.outerHTML,
    extensions: {
      heading: Heading.configure({ levels: [1, 2, 3, 4, 5, 6] })
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(editor.getHTML()).toMatchSnapshot();
});
