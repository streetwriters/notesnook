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

import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, test } from "vitest";
import TableRow from "@tiptap/extension-table-row";
import { OutlineList } from "../../outline-list/index.js";
import { OutlineListItem } from "../../outline-list-item/index.js";
import { TaskItemNode } from "../../task-item/index.js";
import { TaskListNode } from "../../task-list/index.js";
import { BlockId } from "../../block-id/block-id.js";
import TableCell from "../../table-cell/index.js";
import TableHeader from "../../table-header/index.js";
import { Table } from "../../table/index.js";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { widestChildren } from "../containers.js";
import { Page, Paging } from "../index.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

/** The window a container starts with, before anything has been measured. */
const INITIAL = 30;

/**
 * Rows kept outside the window because they hold a column's widest cell. Every
 * column of the test table is widest in the same row.
 */
const WIDEST = 1;

let ids = 0;
function id() {
  return `blk${ids++}`;
}

function para(text: string) {
  return `<p data-block-id="${id()}">${text}</p>`;
}

function listOf(items: number) {
  let html = `<ul data-block-id="${id()}">`;
  for (let i = 0; i < items; i++) html += `<li><p>Item ${i}</p></li>`;
  return html + "</ul>";
}

function taskListOf(items: number) {
  let html = `<ul class="checklist" data-block-id="${id()}">`;
  for (let i = 0; i < items; i++) html += `<li><p>Task ${i}</p></li>`;
  return html + "</ul>";
}

/** A list buried `levels` deep, with the long one at the bottom. */
function nestedOutlineOf(levels: number, items: number) {
  let inner = "";
  for (let i = 0; i < items; i++)
    inner += `<li data-type="outlineListItem"><p>Point ${i}</p></li>`;
  let html = `<ul data-type="outlineList">${inner}</ul>`;
  for (let level = 0; level < levels; level++)
    html = `<ul data-type="outlineList"${
      level === levels - 1 ? ` data-block-id="${id()}"` : ""
    }><li data-type="outlineListItem"><p>Level ${level}</p>${html}</li></ul>`;
  return html;
}

function tableOf(rows: number) {
  let html = `<table data-block-id="${id()}"><tbody>`;
  for (let i = 0; i < rows; i++)
    html += `<tr><td><p>Cell ${i}</p></td><td><p>Value ${i}</p></td></tr>`;
  return html + "</tbody></table>";
}

function createEditor(content: string, thresholdBlocks = 1) {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      TaskListNode,
      TaskItemNode,
      OutlineList,
      OutlineListItem,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      PagedDocument,
      Page,
      BlockId,
      Paging.configure({ enabled: true, pageSize: 50, thresholdBlocks })
    ],
    content
  });
}

function rect(top: number, height: number) {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 800,
    width: 800,
    x: 0,
    y: top,
    toJSON: () => ({})
  } as DOMRect;
}

const ROW_HEIGHT = 32;

/**
 * happy-dom lays nothing out, so the note gets a synthetic geometry: the rows
 * of a container stacked at a fixed height, scrolled down by `scrolledBy`.
 */
function stubLayout(editor: Editor, scrolledBy: number) {
  const editorDom = editor.view.dom as HTMLElement;
  HTMLElement.prototype.getBoundingClientRect = function () {
    if (this === editorDom) return rect(-scrolledBy, 1e6);
    const parent = this.parentElement;
    if (!parent) return rect(0, 0);
    const index = Array.prototype.indexOf.call(parent.children, this);
    if (parent.tagName === "TBODY" || parent.tagName === "UL")
      return rect(index * ROW_HEIGHT - scrolledBy, ROW_HEIGHT);
    return rect(-scrolledBy, 1e6);
  };
}

function frames(count = 2) {
  return new Promise<void>((resolve) => {
    let remaining = count;
    const tick = () =>
      remaining-- > 0 ? requestAnimationFrame(tick) : resolve();
    tick();
  });
}

async function created() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function findList(editor: Editor) {
  let list: ProsemirrorNode | undefined;
  let start = -1;
  editor.state.doc.descendants((node, position) => {
    if (list || node.type.name !== "bulletList") return true;
    list = node;
    start = position;
    return false;
  });
  if (!list) throw new Error("no list");
  return { list, start };
}

function hidden(editor: Editor) {
  return editor.view.dom.querySelectorAll("[data-virtual-child]");
}

function shown(editor: Editor) {
  return editor.view.dom.querySelectorAll(
    "li:not([data-virtual-child]):not([data-virtual-spacer])"
  );
}

/** The container's children in order, without the spacers standing in for runs. */
function childrenOf(editor: Editor, selector: string) {
  const host = editor.view.dom.querySelector(selector);
  return Array.from(host?.children ?? []).filter(
    (element) => !element.hasAttribute("data-virtual-spacer")
  );
}

describe("nested virtualization", () => {
  test("a long list renders only the children in its window", async () => {
    const editor = createEditor(para("intro") + listOf(200));
    await created();

    expect(shown(editor)).toHaveLength(INITIAL);
    expect(hidden(editor)).toHaveLength(200 - INITIAL);
    editor.destroy();
  });

  test("a short list is rendered whole", async () => {
    const editor = createEditor(para("intro") + listOf(20));
    await created();

    expect(shown(editor)).toHaveLength(20);
    expect(hidden(editor)).toHaveLength(0);
    editor.destroy();
  });

  test("the children left out are still in the document", async () => {
    const editor = createEditor(para("intro") + listOf(200));
    await created();

    expect(hidden(editor).length).toBeGreaterThan(0);
    const html = editor.getHTML();
    expect(html.match(/<li/g)).toHaveLength(200);
    expect(html).toContain("Item 199");
    expect(html).not.toContain("data-virtual-child");
    editor.destroy();
  });

  test("the child holding the caret is rendered wherever it is", async () => {
    const editor = createEditor(para("intro") + listOf(200));
    await created();

    const list = editor.state.doc.child(0).child(1);
    let position = 3 + para("intro").length;
    for (let i = 0; i < 150; i++) position += list.child(i).nodeSize;
    editor.commands.setTextSelection(position + 2);

    expect(shown(editor).length).toBe(INITIAL + 1);
    editor.destroy();
  });

  test("every child is rendered while the browser prints", async () => {
    const editor = createEditor(para("intro") + listOf(200));
    await created();
    expect(hidden(editor).length).toBeGreaterThan(0);

    window.dispatchEvent(new Event("beforeprint"));

    expect(hidden(editor)).toHaveLength(0);
    expect(editor.getText()).toContain("Item 199");
    editor.destroy();
  });

  test("a long table renders only the rows in its window", async () => {
    const editor = createEditor(para("intro") + tableOf(2000));
    await created();

    expect(childrenOf(editor, "tbody")).toHaveLength(2000);
    expect(hidden(editor)).toHaveLength(2000 - INITIAL - WIDEST);
    const spacers = editor.view.dom.querySelectorAll("[data-virtual-spacer]");
    expect(editor.view.dom.querySelectorAll("td")).toHaveLength(
      (INITIAL + WIDEST) * 2 + spacers.length
    );
    editor.destroy();
  });

  test("a stand-in row keeps the tag its container expects", async () => {
    const editor = createEditor(para("intro") + tableOf(2000));
    await created();

    for (const element of Array.from(hidden(editor)))
      expect(element.tagName).toBe("TR");
    editor.destroy();
  });

  test("children come back when their container gets short", async () => {
    const editor = createEditor(para("intro") + listOf(200));
    await created();
    expect(hidden(editor).length).toBeGreaterThan(0);

    const { list, start } = findList(editor);
    let from = start + 1;
    for (let i = 0; i < 20; i++) from += list.child(i).nodeSize;
    editor.view.dispatch(
      editor.state.tr.delete(from, start + list.nodeSize - 1)
    );

    expect(hidden(editor)).toHaveLength(0);
    expect(shown(editor)).toHaveLength(20);
    editor.destroy();
  });

  test("a child inserted into the window renders straight away", async () => {
    const editor = createEditor(para("intro") + listOf(200));
    await created();

    const { list, start } = findList(editor);
    let at = start + 1;
    for (let i = 0; i < 5; i++) at += list.child(i).nodeSize;
    editor.view.dispatch(editor.state.tr.insert(at, list.child(0)));

    expect(hidden(editor)).toHaveLength(201 - INITIAL);

    const items = childrenOf(editor, "ul");
    expect(items.length).toBeGreaterThan(INITIAL);
    for (let i = 0; i < INITIAL; i++)
      expect(items[i].hasAttribute("data-virtual-child")).toBe(false);
    editor.destroy();
  });

  test("the window follows the scroll through a container", async () => {
    const editor = createEditor(para("intro") + tableOf(500), 100);
    await created();
    const layout = HTMLElement.prototype.getBoundingClientRect;

    stubLayout(editor, 200 * ROW_HEIGHT);
    await frames();

    const rows = childrenOf(editor, "tbody");
    const rendered = (index: number) =>
      !rows[index].hasAttribute("data-virtual-child");
    expect(rendered(0)).toBe(false);
    expect(rendered(200)).toBe(true);
    expect(rendered(220)).toBe(true);
    expect(rendered(499)).toBe(false);

    HTMLElement.prototype.getBoundingClientRect = layout;
    editor.destroy();
  });

  test("the row a column is widest in is never left out", async () => {
    const editor = createEditor(para("intro") + tableOf(500), 100);
    await created();
    const layout = HTMLElement.prototype.getBoundingClientRect;

    const table = editor.state.doc.child(1);
    const widest = widestChildren(table);
    expect(widest).toHaveLength(1);

    stubLayout(editor, 400 * ROW_HEIGHT);
    await frames();

    const rows = childrenOf(editor, "tbody");
    for (const index of widest)
      expect(rows[index].hasAttribute("data-virtual-child")).toBe(false);
    expect(rows[widest[0] + 1].hasAttribute("data-virtual-child")).toBe(true);

    HTMLElement.prototype.getBoundingClientRect = layout;
    editor.destroy();
  });

  test("a long task list is windowed too", async () => {
    const editor = createEditor(para("intro") + taskListOf(300), 100);
    await created();

    expect(shown(editor).length).toBeLessThan(60);
    expect(hidden(editor).length).toBeGreaterThan(200);
    expect(editor.getHTML()).toContain("Task 299");
    editor.destroy();
  });

  test("two editors of the same note keep their own measurements", async () => {
    const html = para("intro") + tableOf(300);
    const one = createEditor(html, 100);
    const two = createEditor(html, 100);
    await created();

    type Heights = {
      record(node: ProsemirrorNode, height: number): void;
      runningHeights(id: string, container: ProsemirrorNode): { total: number };
    };
    const heightsOf = (editor: Editor) =>
      (editor.storage.paging as { heights: Heights }).heights;
    const tableOf_ = (editor: Editor) => editor.state.doc.child(1);

    const id = tableOf_(one).attrs.blockId as string;
    expect(id).toBe(tableOf_(two).attrs.blockId);

    heightsOf(one).record(tableOf_(one).child(0), 500);
    const totals = [one, two].map(
      (editor) => heightsOf(editor).runningHeights(id, tableOf_(editor)).total
    );
    expect(totals[0]).not.toBe(totals[1]);

    one.destroy();
    two.destroy();
  });

  test("a long list buried under several levels is still windowed", async () => {
    const editor = createEditor(para("intro") + nestedOutlineOf(5, 300), 100);
    await created();

    expect(hidden(editor).length).toBeGreaterThan(200);
    expect(editor.getHTML()).toContain("Point 299");
    editor.destroy();
  });
});
