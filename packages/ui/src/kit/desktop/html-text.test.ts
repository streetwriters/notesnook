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

import { describe, expect, it } from "vitest";
import { htmlToText } from "./html-text";

describe("htmlToText", () => {
  it("keeps the text of inline HTML", () => {
    expect(htmlToText("Hello <b>bold</b> and <a href='x'>link</a>")).toBe(
      "Hello bold and link"
    );
  });

  it("turns line breaks and block ends into new lines", () => {
    expect(htmlToText("one<br>two<br/>three")).toBe("one\ntwo\nthree");
    expect(htmlToText("<p>one</p><p>two</p>")).toBe("one\ntwo");
  });

  it("decodes character references and leaves unknown ones", () => {
    expect(
      htmlToText("a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#x27; &nbsp;")
    ).toBe("a & b <c> \"d\" 'e' \u00a0");
    expect(htmlToText("&unknown; &#99999999;")).toBe("&unknown; &#99999999;");
  });

  it("drops scripts and styles with their content", () => {
    expect(htmlToText("a<script>alert(1)</script><style>p{}</style>b")).toBe(
      "ab"
    );
  });

  it("handles empty and plain input", () => {
    expect(htmlToText("")).toBe("");
    expect(htmlToText("plain")).toBe("plain");
  });
});
