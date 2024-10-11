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

import { describe, it, expect } from "vitest";
import {
  extractInternalLinks,
  highlightInternalLinks,
  ellipsize
} from "../content-block.js";
import { ContentBlock } from "../../types.js";

describe("ContentBlock Utils", () => {
  describe("extractInternalLinks", () => {
    it("should extract internal links from a block", () => {
      const block: ContentBlock = {
        type: "someType",
        id: "someId",
        content: "This is a test [[nn://note/123|link]]"
      };
      const links = extractInternalLinks(block);
      expect(links).toHaveLength(1);
      expect(links[0].id).toBe("123");
      expect(links[0].text).toBe("link");
    });

    it("should return an empty array if no internal links are present", () => {
      const block: ContentBlock = {
        type: "someType",
        id: "someId",
        content: "This is a test with no links"
      };
      const links = extractInternalLinks(block);
      expect(links).toHaveLength(0);
    });

    it("should skip links with no noteId", () => {
      const block: ContentBlock = {
        type: "someType",
        id: "someId",
        content: "This is a test [[nn://note/|link]] with undefined URL"
      };
      const links = extractInternalLinks(block);
      expect(links).toHaveLength(0);
    });

    it("should extract internal links with '|' in id", () => {
      const block: ContentBlock = {
        type: "someType",
        id: "someId",
        content: "This is a test [[nn://note/myid|ofmyid|actualtext]]"
      };
      const links = extractInternalLinks(block);
      expect(links).toHaveLength(1);
      expect(links[0].id).toBe("myid|ofmyid");
      expect(links[0].text).toBe("actualtext");
    });
  });

  describe("highlightInternalLinks", () => {
    it("should highlight internal links in a block", () => {
      const block: ContentBlock = {
        type: "someType",
        id: "someId",
        content: "This is a test [[nn://note/123|link]]"
      };
      const noteId = "123";
      const highlighted = highlightInternalLinks(block, noteId);
      expect(highlighted).toHaveLength(1);
      expect(highlighted[0][1].highlighted).toBe(true);
      expect(highlighted[0][1].text).toBe("link");
    });

    it("should not highlight links with a different noteId", () => {
      const block: ContentBlock = {
        type: "someType",
        id: "someId",
        content: "This is a test [[nn://note/123|link]]"
      };
      const noteId = "456";
      const highlighted = highlightInternalLinks(block, noteId);
      expect(highlighted).toHaveLength(0);
    });
  });

  describe("ellipsize", () => {
    it("should ellipsize text from the start", () => {
      const text = "This is a long text that needs to be truncated";
      const result = ellipsize(text, 10, "start");
      expect(result).toBe("... truncated");
    });

    it("should ellipsize text from the end", () => {
      const text = "This is a long text that needs to be truncated";
      const result = ellipsize(text, 10, "end");
      expect(result).toBe("This is a ...");
    });

    it("should not ellipsize text if it is shorter than maxLength", () => {
      const text = "Short text";
      const result = ellipsize(text, 20, "end");
      expect(result).toBe("Short text");
    });
  });
});
