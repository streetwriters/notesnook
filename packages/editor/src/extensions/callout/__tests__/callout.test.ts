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
import { createEditor } from "../../../../test-utils/index.js";
import { Callout } from "../callout.js";
import { Heading } from "../../heading/heading.js";
import { Paragraph } from "../../paragraph/paragraph.js";

describe("callout", () => {
  test("tapping the chevron corner of a callout toggles it collapsed", () => {
    const { editor } = createEditor({
      initialContent: `<div class="callout" data-callout-type="info"><h4>INFO</h4><p>body</p></div>`,
      extensions: {
        callout: Callout,
        heading: Heading,
        paragraph: Paragraph
      }
    });

    const dom = editor.view.dom as HTMLElement;
    const heading = dom.querySelector(".callout > h4") as HTMLElement;
    expect(heading).toBeTruthy();

    const collapsed = () => {
      let value: boolean | undefined;
      editor.state.doc.descendants((node) => {
        if (node.type.name === Callout.name) value = node.attrs.collapsed;
      });
      return value;
    };

    const tapAt = (clientX: number) =>
      heading.dispatchEvent(
        new MouseEvent("mousedown", {
          button: 0,
          clientX,
          clientY: 5,
          bubbles: true,
          cancelable: true
        })
      );

    expect(collapsed()).toBe(false);
    tapAt(-10);
    expect(collapsed()).toBe(true);
    tapAt(-10);
    expect(collapsed()).toBe(false);

    tapAt(8);
    expect(collapsed()).toBe(true);
    tapAt(8);
    expect(collapsed()).toBe(false);
  });
});
