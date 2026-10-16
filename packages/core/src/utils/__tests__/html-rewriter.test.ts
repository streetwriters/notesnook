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
import { HTMLRewriter } from "../html-rewriter.js";

test("implied close of a non-void element doesn't write /> into text", () => {
  expect(new HTMLRewriter().transform("<p>a<p>b")).toBe("<p>a</p><p>b</p>");
});

test("void and self-closing elements are still self-closed", () => {
  expect(new HTMLRewriter().transform('<p>a<img src="x"><br/>b</p>')).toBe(
    '<p>a<img src="x"/><br/>b</p>'
  );
});

test("attribute values containing quotes are escaped", () => {
  expect(new HTMLRewriter().transform(`<p title='say "hi"'>a</p>`)).toBe(
    '<p title="say &quot;hi&quot;">a</p>'
  );
});
