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
import { containersWorthWindowing, widestChildren } from "../containers.js";
import { countPages, Page, Paging } from "../index.js";

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

function outlineListOf(items: number) {
  let html = `<ul data-type="outlineList" data-block-id="${id()}">`;
  for (let i = 0; i < items; i++)
    html += `<li data-type="outlineListItem"><p>Point ${i}</p></li>`;
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

  test("a page of ordinary prose is untouched", async () => {
    let content = "";
    for (let i = 0; i < 200; i++) content += para(`Paragraph ${i}`);
    const editor = createEditor(content);
    await created();

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

    // every row still has an element of its own; the ones left out are empty
    expect(childrenOf(editor, "tbody")).toHaveLength(2000);
    expect(hidden(editor)).toHaveLength(2000 - INITIAL - WIDEST);
    // the cells of the rows that are left out are never built
    // the rows left out are empty and hidden, so their cells are never built;
    // each spacer carries one cell of its own
    const spacers = editor.view.dom.querySelectorAll("[data-virtual-spacer]");
    expect(editor.view.dom.querySelectorAll("td")).toHaveLength(
      (INITIAL + WIDEST) * 2 + spacers.length
    );
    editor.destroy();
  });

  test("the rows left out are still in the document", async () => {
    const editor = createEditor(para("intro") + tableOf(2000));
    await created();

    const html = editor.getHTML();
    expect(html.match(/<tr/g)).toHaveLength(2000);
    expect(html).toContain("Value 1999");
    editor.destroy();
  });

  test("a stand-in row keeps the tag its container expects", async () => {
    const editor = createEditor(para("intro") + tableOf(2000));
    await created();

    for (const element of Array.from(hidden(editor)))
      expect(element.tagName).toBe("TR");
    editor.destroy();
  });

  test("a note too small to be paged is still windowed", async () => {
    // the reported case: one enormous table is only a block or two, so it
    // never reaches the threshold that turns a note into pages
    const editor = createEditor(para("intro") + tableOf(2000), 100);
    await created();

    expect(countPages(editor.state.doc)).toBe(0);
    expect(hidden(editor)).toHaveLength(2000 - INITIAL - WIDEST);
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

    // the container is still windowed: the stand-ins find it through the DOM,
    // because asking each one for its position would cost a sibling scan
    expect(hidden(editor)).toHaveLength(201 - INITIAL);

    const items = childrenOf(editor, "ul");
    expect(items.length).toBeGreaterThan(INITIAL);
    for (let i = 0; i < INITIAL; i++)
      expect(items[i].hasAttribute("data-virtual-child")).toBe(false);
    editor.destroy();
  });

  test("the window follows the scroll through a container", async () => {
    // a table draws itself, so its element carries no block id -- the window
    // still has to be measured through it
    const editor = createEditor(para("intro") + tableOf(500), 100);
    await created();
    const layout = HTMLElement.prototype.getBoundingClientRect;

    stubLayout(editor, 200 * ROW_HEIGHT);
    await frames();

    const rows = childrenOf(editor, "tbody");
    const rendered = (index: number) =>
      !rows[index].hasAttribute("data-virtual-child");
    // the rows seeded at the top have been given up for the ones on screen
    expect(rendered(0)).toBe(false);
    expect(rendered(200)).toBe(true);
    expect(rendered(220)).toBe(true);
    expect(rendered(499)).toBe(false);

    HTMLElement.prototype.getBoundingClientRect = layout;
    editor.destroy();
  });

  test("the window follows the scroll past an element the editor did not draw", async () => {
    // another plugin's widget, a drag handle, anything: the editor's children
    // and the document's no longer line up index for index
    const editor = createEditor(para("intro") + tableOf(500), 100);
    await created();
    const layout = HTMLElement.prototype.getBoundingClientRect;
    editor.view.dom.insertBefore(
      document.createElement("div"),
      editor.view.dom.firstChild
    );

    stubLayout(editor, 200 * ROW_HEIGHT);
    await frames();

    const rows = childrenOf(editor, "tbody");
    expect(rows[0].hasAttribute("data-virtual-child")).toBe(true);
    expect(rows[220].hasAttribute("data-virtual-child")).toBe(false);

    HTMLElement.prototype.getBoundingClientRect = layout;
    editor.destroy();
  });

  test("the row a column is widest in is never left out", async () => {
    // otherwise the column resizes, and every row re-wraps, as it scrolls past
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
    // and it really is outside the window
    expect(rows[widest[0] + 1].hasAttribute("data-virtual-child")).toBe(true);

    HTMLElement.prototype.getBoundingClientRect = layout;
    editor.destroy();
  });

  test("a long task list is windowed too", async () => {
    // task items draw themselves, so they opt in through `virtualizable`
    // rather than through the views the plugin registers
    const editor = createEditor(para("intro") + taskListOf(300), 100);
    await created();

    expect(shown(editor).length).toBeLessThan(60);
    expect(hidden(editor).length).toBeGreaterThan(200);
    expect(editor.getHTML()).toContain("Task 299");
    editor.destroy();
  });

  test("a long outline list is windowed too", async () => {
    const editor = createEditor(para("intro") + outlineListOf(300), 100);
    await created();

    expect(editor.state.doc.child(1).type.name).toBe("outlineList");
    expect(editor.state.doc.child(1).firstChild?.type.name).toBe(
      "outlineListItem"
    );
    expect(hidden(editor).length).toBeGreaterThan(200);
    expect(editor.getHTML()).toContain("Point 299");
    editor.destroy();
  });

  test("children left out cost the browser no layout", async () => {
    const editor = createEditor(para("intro") + tableOf(2000), 100);
    await created();

    for (const element of Array.from(hidden(editor))) {
      // display:none means the browser builds no layout box at all, which is
      // the whole point -- an empty box of the right height is still a box
      expect((element as HTMLElement).style.display).toBe("none");
      expect(element.children).toHaveLength(0);
    }
    editor.destroy();
  });

  test("the spacers hold the space of every run left out", async () => {
    const editor = createEditor(para("intro") + tableOf(2000), 100);
    await created();

    const spacers = editor.view.dom.querySelectorAll("[data-virtual-spacer]");
    expect(spacers.length).toBeGreaterThan(0);

    const heights = (
      editor.storage.paging as {
        heights: { heightFor(node: ProsemirrorNode): number };
      }
    ).heights;
    const table = editor.state.doc.child(1);
    const rows = childrenOf(editor, "tbody");
    let missing = 0;
    rows.forEach((row, index) => {
      if (row.hasAttribute("data-virtual-child"))
        missing += heights.heightFor(table.child(index));
    });

    const held = Array.from(spacers).reduce(
      (total, element) =>
        total +
        parseFloat((element.firstElementChild as HTMLElement).style.height),
      0
    );
    expect(held).toBeCloseTo(missing, -1);
    editor.destroy();
  });

  test("what a rendered row measures is remembered for its stand-in", async () => {
    const editor = createEditor(para("intro") + tableOf(2000), 100);
    await created();
    const layout = HTMLElement.prototype.getBoundingClientRect;
    const height = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight"
    );

    // happy-dom measures everything as zero, so the rows are given a height
    // that is nothing like the estimate
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return this.tagName === "TR" ? 77 : 0;
      }
    });
    stubLayout(editor, 0);
    await frames();

    const heights = (
      editor.storage.paging as {
        heights: { heightFor(node: ProsemirrorNode): number };
      }
    ).heights;
    const table = editor.state.doc.child(1);
    expect(heights.heightFor(table.child(0))).toBe(77);

    if (height)
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", height);
    HTMLElement.prototype.getBoundingClientRect = layout;
    editor.destroy();
  });

  test("two editors of the same note keep their own measurements", async () => {
    // the app shows more than one editor at a time, and a note open twice has
    // the same block ids in both -- anything keyed by those has to belong to
    // one editor, not to the module
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
    // outline and task lists nest as deep as the writer likes, and the long
    // one can be at the bottom of that
    const editor = createEditor(para("intro") + nestedOutlineOf(5, 300), 100);
    await created();

    expect(hidden(editor).length).toBeGreaterThan(200);
    expect(editor.getHTML()).toContain("Point 299");
    editor.destroy();
  });

  test("a nested container keeps its name when the text around it changes", async () => {
    // the window is remembered against this name, so a name that moved with the
    // text would throw the reader back to the top of the list on every keystroke
    const editor = createEditor(para("intro") + nestedOutlineOf(5, 300), 100);
    await created();

    const block = () => editor.state.doc.child(1);
    const before = containersWorthWindowing(block()).map((c) => c.id);
    expect(before).toHaveLength(1);

    // inside the same block and above the nested list, so anything naming it
    // by where it sits would be renaming it on every keystroke
    let at = -1;
    const blockStart = editor.state.doc.child(0).nodeSize;
    editor.state.doc.descendants((node, position) => {
      if (at < 0 && position > blockStart && node.type.name === "paragraph")
        at = position + 1;
      return at < 0;
    });
    editor.commands.setTextSelection(at);
    editor.commands.insertContent("typing above the list");

    expect(containersWorthWindowing(block()).map((c) => c.id)).toEqual(before);
    editor.destroy();
  });

  test("a stand-in child keeps the tag its container expects", async () => {
    const editor = createEditor(para("intro") + listOf(200));
    await created();

    for (const element of Array.from(hidden(editor)))
      expect(element.tagName).toBe("LI");
    editor.destroy();
  });
});
