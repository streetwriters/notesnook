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
import { createEditor, h } from "../../../../test-utils";
import OrderedList from "../../ordered-list";
import { ListItem } from "../../list-item";
import { getTextBetween, transformCopied, DOMSerializer2 } from "../index";
import { Paragraph } from "../../paragraph";

test("copied list items shouldn't contain extra newlines", (t) => {
  const { editor } = createEditor({
    initialContent: h("div", [
      h("ol", [
        h("li", [
          h("p", ["This is line: ", h("em", ["number 1."])]),
          h("p", ["And this is line number 2."])
        ]),
        h("li", [h("p", ["This is line number 3."])])
      ])
    ]).innerHTML,
    extensions: {
      orderedList: OrderedList,
      listItem: ListItem
    }
  });

  const serializer = DOMSerializer2.fromSchema(editor.view.state.schema);
  t.expect(
    new XMLSerializer().serializeToString(
      serializer.serializeFragment(
        editor.state.doc.slice(0, editor.state.doc.nodeSize - 2).content
      )
    )
  ).toBe(
    "<ol><li><p>This is line: <em>number 1.</em></p><p>And this is line number 2.</p></li><li>This is line number 3.</li></ol>"
  );

  t.expect(
    getTextBetween(
      editor.state.doc.slice(0, editor.state.doc.nodeSize - 2),
      editor.schema
    )
  ).toBe(`This is line: number 1.
And this is line number 2.
This is line number 3.`);
});

test("copying a single list item shouldn't copy the list metadata", (t) => {
  const { editor } = createEditor({
    initialContent: h("div", [h("ol", [h("li", ["Hello"])])]).innerHTML,
    extensions: {
      orderedList: OrderedList,
      listItem: ListItem
    }
  });

  t.expect(
    transformCopied(
      editor.state.doc.slice(0, editor.state.doc.nodeSize - 2)
    ).toJSON()
  ).toMatchSnapshot();
});

const createParagraphs = (spacing: "double" | "single") => [
  h("p", ["I am paragraph 1."], { "data-spacing": spacing }),
  h("p", ["I am paragraph 2."], { "data-spacing": spacing }),
  h("p", ["I am paragraph 3."], { "data-spacing": spacing })
];

const createParagraphsWithSpaces = (spacing: "double" | "single") => [
  h("p", ["I am paragraph 1."], { "data-spacing": spacing }),
  h("p", [h("br")], { "data-spacing": spacing }),
  h("p", [h("br")], { "data-spacing": spacing }),
  h("p", ["I am paragraph 2."], { "data-spacing": spacing }),
  h("p", [h("br")], { "data-spacing": spacing }),
  h("p", [h("br")], { "data-spacing": spacing }),
  h("p", ["I am paragraph 3."], { "data-spacing": spacing })
];

const paragraphTestCases = [
  {
    spacing: "double",
    content: createParagraphs("double"),
    expectedHtml: `<p data-spacing="double">I am paragraph 1.</p><p data-spacing="double">I am paragraph 2.</p><p data-spacing="double">I am paragraph 3.</p>`,
    expectedText: `I am paragraph 1.\n\nI am paragraph 2.\n\nI am paragraph 3.`
  },
  {
    spacing: "single",
    content: createParagraphs("single"),
    expectedHtml: `<p data-spacing="single">I am paragraph 1.<br>I am paragraph 2.<br>I am paragraph 3.</p>`,
    expectedText: `I am paragraph 1.\nI am paragraph 2.\nI am paragraph 3.`
  },
  {
    spacing: "double",
    content: createParagraphsWithSpaces("double"),
    expectedHtml: `<p data-spacing="double">I am paragraph 1.</p><p data-spacing="double"></p><p data-spacing="double"></p><p data-spacing="double">I am paragraph 2.</p><p data-spacing="double"></p><p data-spacing="double"></p><p data-spacing="double">I am paragraph 3.</p>`,
    expectedText: `I am paragraph 1.\n\n\n\nI am paragraph 2.\n\n\n\nI am paragraph 3.`
  },
  {
    spacing: "single",
    content: createParagraphsWithSpaces("single"),
    expectedHtml: `<p data-spacing="single">I am paragraph 1.<br><br><br>I am paragraph 2.<br><br><br>I am paragraph 3.</p>`,
    expectedText: `I am paragraph 1.\n\n\nI am paragraph 2.\n\n\nI am paragraph 3.`
  },
  {
    spacing: "mixed",
    content: [
      ...createParagraphs("double"),
      ...createParagraphs("single"),
      ...createParagraphs("double")
    ],
    expectedHtml: `<p data-spacing="double">I am paragraph 1.</p><p data-spacing="double">I am paragraph 2.</p><p data-spacing="double">I am paragraph 3.<br>I am paragraph 1.<br>I am paragraph 2.<br>I am paragraph 3.</p><p data-spacing="double">I am paragraph 1.</p><p data-spacing="double">I am paragraph 2.</p><p data-spacing="double">I am paragraph 3.</p>`,
    expectedText: `I am paragraph 1.\n\nI am paragraph 2.\n\nI am paragraph 3.\nI am paragraph 1.\nI am paragraph 2.\nI am paragraph 3.\n\nI am paragraph 1.\n\nI am paragraph 2.\n\nI am paragraph 3.`
  },
  {
    spacing: "mixed 2",
    content: [
      h("p", ["I am paragraph 1."], { "data-spacing": "double" }),
      h("p", ["I am paragraph 2."], { "data-spacing": "single" }),
      h("p", ["I am paragraph 3."], { "data-spacing": "double" }),
      h("p", ["I am paragraph 4."], { "data-spacing": "single" }),
      h("p", ["I am paragraph 5."], { "data-spacing": "single" }),
      h("p", ["I am paragraph 6."], { "data-spacing": "double" })
    ],
    expectedHtml: `<p data-spacing="double">I am paragraph 1.<br>I am paragraph 2.</p><p data-spacing="double">I am paragraph 3.<br>I am paragraph 4.<br>I am paragraph 5.</p><p data-spacing="double">I am paragraph 6.</p>`,
    expectedText: `I am paragraph 1.\nI am paragraph 2.\n\nI am paragraph 3.\nI am paragraph 4.\nI am paragraph 5.\n\nI am paragraph 6.`
  }
];
for (const testCase of paragraphTestCases) {
  test(`copying should respect paragraph spacing (${testCase.spacing})`, (t) => {
    const { editor } = createEditor({
      initialContent: h("div", testCase.content).innerHTML,
      extensions: {
        paragraph: Paragraph,
        hardBreak: false
      }
    });

    const serializer = DOMSerializer2.fromSchema(editor.view.state.schema);
    t.expect(
      new XMLSerializer().serializeToString(
        serializer.serializeFragment(
          editor.state.doc.slice(0, editor.state.doc.nodeSize - 2).content
        )
      )
    ).toBe(testCase.expectedHtml);

    t.expect(
      getTextBetween(
        editor.state.doc.slice(0, editor.state.doc.nodeSize - 2),
        editor.schema
      )
    ).toBe(testCase.expectedText);
  });
}
