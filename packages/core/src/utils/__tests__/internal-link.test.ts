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
import { parseInternalLink } from "../internal-link";

describe("parseInternalLink", () => {
  const invalidInternalLinks = [
    "",
    "invalid-url",
    "http://google.com",
    "https://google.com"
  ];
  invalidInternalLinks.forEach((url) => {
    it(`should return undefined when not internal link: ${url}`, () => {
      expect(parseInternalLink(url)).toBeUndefined();
    });
  });
  const validInternalLinks = [
    {
      url: "nn://note/123",
      expected: { type: "note", id: "123", params: {} }
    },
    {
      url: "nn://note/123?blockId=456",
      expected: { type: "note", id: "123", params: { blockId: "456" } }
    }
  ];
  validInternalLinks.forEach(({ url, expected }) => {
    it(`should parse internal link: ${url}`, () => {
      expect(parseInternalLink(url)).toEqual(expected);
    });
  });
});
