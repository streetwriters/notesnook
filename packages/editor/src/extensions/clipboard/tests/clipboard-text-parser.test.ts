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

import { test } from "vitest";
import {
  convertTextToHTML,
  isProbablyMarkdown
} from "../clipboard-text-parser.js";

const textCases = [
  `Hello\r\nworld`,
  `What\n\n\nNO!`,
  `Hello\r\nWorld\nwhat?\nNay!`
];

for (const testCase of textCases) {
  test(`convert text to html`, (t) => {
    t.expect(convertTextToHTML(testCase)).toMatchSnapshot();
  });
}

const markdownCases = [
  // Single-line markdown elements
  {
    text: "# Header",
    isMarkdown: true
  },
  {
    text: "## Second level",
    isMarkdown: true
  },
  {
    text: "#Not a header",
    isMarkdown: false
  },
  {
    text: "- [ ] Task",
    isMarkdown: true
  },
  {
    text: "- [x] Completed task",
    isMarkdown: true
  },
  {
    text: "- []Not a task",
    isMarkdown: false
  },

  // Tables
  {
    text: "|Column 1|Column 2|",
    isMarkdown: true
  },
  {
    text: "| Name | Age |",
    isMarkdown: true
  },
  {
    text: "|Not|A|Table",
    isMarkdown: false
  },

  // Blockquotes
  {
    text: "> Quoted text",
    isMarkdown: true
  },
  {
    text: ">Not a quote",
    isMarkdown: false
  },

  // Multi-line content
  {
    text: `# Header
  Some paragraph text

  - List item 1
  - List item 2`,
    isMarkdown: true
  },
  {
    text: `\`\`\`javascript
  const x = 1;
  console.log(x);
  \`\`\``,
    isMarkdown: true
  },

  // Inline formatting
  {
    text: "This is **bold** text with some other **bold** content and some *italic* text and some `code` text and ~~strikethough~~ is ~~awesome~~ just okey!",
    isMarkdown: true
  },

  // Lists
  {
    text: `- Item 1
  - Item 2`,
    isMarkdown: true
  },
  {
    text: `1. First
  2. Second`,
    isMarkdown: true
  },

  // Plain text (negative cases)
  {
    text: "Just plain text",
    isMarkdown: false
  },
  {
    text: "Hello world",
    isMarkdown: false
  },
  {
    text: "12345",
    isMarkdown: false
  },

  // HTML (negative cases)
  {
    text: "<html><body>Test</body></html>",
    isMarkdown: false
  },
  {
    text: "<div>Content</div>",
    isMarkdown: false
  },

  // Special cases (negative)
  {
    text: "test@example.com",
    isMarkdown: false
  },
  {
    text: "https://example.com",
    isMarkdown: false
  },

  // Edge cases
  {
    text: "",
    isMarkdown: false
  },
  {
    text: " ",
    isMarkdown: false
  },
  {
    text: "*",
    isMarkdown: false
  },
  {
    text: "#",
    isMarkdown: false
  },

  // Mixed content
  {
    text: `# Header
  Regular paragraph with **bold** and *italic*.

  \`\`\`
  code block
  \`\`\`

  1. List item
  2. Another item

  > Blockquote`,
    isMarkdown: true
  },

  // Ambiguous cases
  {
    text: "2 * 3 = 6",
    isMarkdown: false
  },
  {
    text: "c:\\path\\to\\file",
    isMarkdown: false
  },
  {
    text: "From: user@example.com",
    isMarkdown: false
  },

  // Formatting combinations

  {
    text: "[Link](https://example.com) with some **bold** text and other _stuff_ **Bold _and italic_**.",
    isMarkdown: true
  },
  {
    text: "![Image](image.jpg)",
    isMarkdown: true
  },

  // Reference-style links
  {
    text: `[link][1]
  [1]: https://example.com`,
    isMarkdown: true
  },

  // Whitespace variations
  {
    text: "  # Header with spaces",
    isMarkdown: true
  },
  {
    text: "\t> Tabbed quote",
    isMarkdown: true
  },

  // Common user input patterns
  {
    text: "Hello\nWorld",
    isMarkdown: false
  },
  {
    text: "Item one\nItem two\nItem three",
    isMarkdown: false
  },
  {
    text: "YES",
    isMarkdown: false
  },
  {
    text: "OK",
    isMarkdown: false
  }
];

for (const testCase of markdownCases) {
  test(`detect as markdown ${testCase.text}`, (t) => {
    t.expect(isProbablyMarkdown(testCase.text)).toBe(testCase.isMarkdown);
  });
}
