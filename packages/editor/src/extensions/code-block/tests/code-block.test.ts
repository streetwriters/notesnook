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

import { createEditor, h } from "../../../../test-utils/index.js";
import { expect, test, vi } from "vitest";
import { CodeBlock, inferLanguage } from "../code-block.js";
import { HighlighterPlugin } from "../highlighter.js";
import { getChangedNodes } from "../../../utils/prosemirror.js";
import { refractor } from "refractor/lib/core";

const CODEBLOCKS_HTML = h("div", [
  h("pre", [h("code", ["function hello() { }"])], {
    class: "language-javascript"
  }),
  h("pre", [h("code", ["function hello() { }"])], {
    class: "language-typescript"
  })
]).innerHTML;

const CODE_PARAGRAPH = `function helloWorld() {
  console.log('Hello, World!');
}`;

interface DocumentNode {
  type: string;
  attrs?: { [key: string]: any };
  content?: DocumentNode[];
  text?: string;
}

test("codeblocks should get highlighted on init", async () => {
  const editorElement = h("div");
  createEditor({
    element: editorElement,
    initialContent: CODEBLOCKS_HTML,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(editorElement.outerHTML).toMatchSnapshot();
});

test("codeblocks should get highlighted after pasting", async () => {
  const editorElement = h("div");
  const { editor } = createEditor({
    element: editorElement,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  editor.commands.setContent(CODEBLOCKS_HTML, true, {
    preserveWhitespace: true
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(editorElement.outerHTML).toMatchSnapshot();
});

test("codeblocks should not be updated if other content is changed", async () => {
  const editorElement = h("div");
  const { editor } = createEditor({
    element: editorElement,
    initialContent: CODEBLOCKS_HTML,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  const onTransactionMock = vi.fn();
  editor.on("transaction", ({ transaction }) => {
    const changedNodes = getChangedNodes(transaction).map(
      (n) => n.node.type.name
    );
    onTransactionMock(changedNodes);
  });

  editor.commands.insertContentAt(
    editor.state.doc.nodeSize - 2,
    h("p", ["A new paragraph."]).outerHTML
  );

  expect(onTransactionMock).toHaveBeenCalledOnce();
  expect(onTransactionMock).toHaveBeenCalledWith(["paragraph"]);
  expect(editorElement.outerHTML).toMatchSnapshot();
});

test("pasting code from vscode should automatically create a syntax highlighted codeblock", async () => {
  const editorElement = h("div");
  const { editor } = createEditor({
    element: editorElement,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  const clipboardEvent = new Event("paste", {
    bubbles: true,
    cancelable: true,
    composed: true
  });

  (clipboardEvent as unknown as any)["clipboardData"] = {
    getData: (type: string) =>
      type === "text/plain"
        ? `function hello()
{
  const world = "hello";
}`
        : type === "vscode-editor-data"
        ? JSON.stringify({ mode: "javascript" })
        : undefined
  };

  editor.view.dom.dispatchEvent(clipboardEvent);

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(editorElement.outerHTML).toMatchSnapshot();
});

test("infer code language from class", async () => {
  expect(
    inferLanguage(h("pre", [], { class: "language-js hello world hope" }))
  ).toBe("javascript");

  expect(
    inferLanguage(h("pre", [], { class: "lang-typescript hello world hope" }))
  ).toBe("typescript");

  expect(
    inferLanguage(h("pre", [], { class: "brush:js hello world hope" }))
  ).toBe("javascript");

  expect(
    inferLanguage(h("pre", [], { class: "brush: js hello world hope" }))
  ).toBe("javascript");

  expect(inferLanguage(h("pre", [], { lang: "javascript" }))).toBe(
    "javascript"
  );

  expect(
    inferLanguage(
      h("pre", [], { class: "brush: js hello world hope", lang: "typescript" })
    )
  ).toBe("javascript");
});

test("editing code in a highlighted code block should not be too slow", async () => {
  const editorElement = h("div");
  const { editor } = createEditor({
    element: editorElement,
    initialContent: CODEBLOCKS_HTML,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  const plugin = HighlighterPlugin({
    name: CodeBlock.name,
    defaultLanguage: "plaintext"
  });
  let highlighterState = plugin.spec.state?.init(editor.state, editor.state);

  expect(highlighterState?.decorations).toBeDefined();
  expect(highlighterState?.languages).toBeDefined();

  const timings: number[] = [];
  for (let i = 0; i < 100; ++i) {
    const { tr } = editor.state;
    tr.insertText(`const hello${i} = ${i};`, tr.doc.nodeSize - 3);
    const now = Date.now();
    highlighterState = plugin.spec.state?.apply(
      tr,
      highlighterState!,
      editor.state,
      editor.state
    );
    editor.view.dispatch(tr);
    timings.push(Date.now() - now);
  }

  expect(timings.reduce((a, b) => a + b) / timings.length).toBeLessThan(16);
  expect(editorElement.outerHTML).toMatchSnapshot();
});

test("Adding a new codeblock & changing the language should apply the new highlighting", async () => {
  const editorElement = h("div");
  const { editor } = createEditor({
    element: editorElement,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  editor.commands.setCodeBlock();
  editor.commands.insertContent("function hello() { }");

  editor.commands.updateAttributes(CodeBlock.name, { language: "javascript" });

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(editorElement.outerHTML).toMatchSnapshot();
  expect(refractor.registered("javascript")).toBe(true);
});

test("Switching codeblock language should register the new language", async () => {
  const editorElement = h("div");
  const { editor } = createEditor({
    element: editorElement,
    initialContent: CODEBLOCKS_HTML,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });
  editor.commands.updateAttributes(CodeBlock.name, { language: "java" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(refractor.registered("java")).toBe(true);
});

test("Toggling multiple paragraphs into a codeblock should make one codeblock", async () => {
  const editorElement = h("div");
  const { editor } = createEditor({
    element: editorElement,
    initialContent: CODE_PARAGRAPH,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  const docLength = editor.state.doc.nodeSize - 2;

  editor.commands.setTextSelection({ from: 0, to: docLength });
  editor.commands.toggleCodeBlock();
  editor.commands.updateAttributes(CodeBlock.name, { language: "javascript" });

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(editorElement.outerHTML).toMatchSnapshot();

  const docJSON = editor.state.doc.toJSON();
  const content = docJSON.content;
  const codeBlockNodes = content.filter(
    (node: DocumentNode) => node.type === "codeblock"
  );
  const otherNodes = content.filter(
    (node: DocumentNode) => node.type !== "codeblock"
  );

  expect(codeBlockNodes).toHaveLength(1);
  expect(otherNodes).toHaveLength(0);
});

test("Toggling from a codeblock should make codeblock disappear", async () => {
  const editorElement = document.createElement("div");
  const { editor } = createEditor({
    element: editorElement,
    initialContent: CODEBLOCKS_HTML,
    extensions: {
      codeblock: CodeBlock,
      codeBlock: false,
      code: false
    }
  });

  const docLength = editor.state.doc.nodeSize - 2;

  editor.commands.setTextSelection({ from: 0, to: docLength });

  editor.commands.toggleCodeBlock();

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(editorElement.outerHTML).toMatchSnapshot();

  const docJSON = editor.state.doc.toJSON();
  const content = docJSON.content;
  const codeBlockNodes = content.filter(
    (node: DocumentNode) => node.type === "codeblock"
  );
  const paragraphNodes = content.filter(
    (node: DocumentNode) => node.type === "paragraph"
  );

  expect(codeBlockNodes).toHaveLength(0);
  expect(paragraphNodes).toHaveLength(2);
});
