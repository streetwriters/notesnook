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
import { findIframe, getAttribute } from "../embed-code.js";

describe("embed code", () => {
  test("reads src, width and height of the iframe", () => {
    const iframe = findIframe(
      `<div class="wrap"><iframe width="560" height='315' src="https://www.youtube.com/embed/x?a=1&b=2" allowfullscreen></iframe></div>`
    );
    expect(iframe).not.toBeNull();
    expect(getAttribute(iframe!, "src")).toBe(
      "https://www.youtube.com/embed/x?a=1&b=2"
    );
    expect(getAttribute(iframe!, "width")).toBe("560");
    expect(getAttribute(iframe!, "height")).toBe("315");
  });

  test("ignores attributes that only end with the name", () => {
    const iframe = findIframe(`<IFRAME data-src="bad" src=https://a.b/c>`);
    expect(getAttribute(iframe!, "src")).toBe("https://a.b/c");
  });

  test("has no iframe or no src", () => {
    expect(findIframe("<div>hello</div>")).toBeNull();
    expect(getAttribute(findIframe("<iframe width=10>")!, "src")).toBeNull();
  });
});
