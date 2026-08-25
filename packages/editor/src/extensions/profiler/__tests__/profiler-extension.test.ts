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

import { afterEach, describe, expect, test } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EditorProfiler } from "../index.js";
import { BlockId } from "../../block-id/block-id.js";
import { profiler } from "../../../utils/profiler.js";

function html(blocks: number) {
  let content = "";
  for (let i = 0; i < blocks; i++) content += `<p>Paragraph number ${i}.</p>`;
  return content;
}

function createEditor(blocks: number) {
  return new Editor({
    extensions: [StarterKit, BlockId, EditorProfiler],
    content: html(blocks)
  });
}

afterEach(() => {
  profiler.disable();
  profiler.reset();
});

describe("profiler extension", () => {
  test("collects nothing while the profiler is disabled", () => {
    profiler.disable();
    const editor = createEditor(10);
    editor.view.dispatch(editor.state.tr.insertText("a", 1));

    expect(profiler.report().timings).toEqual({});
    editor.destroy();
  });

  test("measures dispatch, dom update and block id assignment", () => {
    const editor = createEditor(20);
    profiler.enable();
    editor.view.dispatch(editor.state.tr.insertText("hello", 1));

    const report = profiler.report();
    expect(report.timings["tx.dispatch"].count).toBe(1);
    expect(report.timings["render.updateState"].count).toBeGreaterThanOrEqual(
      1
    );
    expect(report.timings["tx.stateAndPlugins"].count).toBe(1);
    expect(report.timings["blockId.appendTransaction"].count).toBe(1);
    expect(report.counters["tx.docChanged"]).toBe(1);
    expect(report.counters["blockId.blocksScanned"]).toBe(20);
    editor.destroy();
  });

  test("separates document changes from view-only transactions", () => {
    const editor = createEditor(5);
    profiler.enable();
    editor.view.dispatch(editor.state.tr.insertText("a", 1));
    editor.view.dispatch(editor.state.tr.setMeta("noop", true));

    const report = profiler.report();
    expect(report.counters["tx.count"]).toBe(2);
    expect(report.timings["tx.dispatch.docChanged"].count).toBe(1);
    expect(report.timings["tx.dispatch.viewOnly"].count).toBe(1);
    editor.destroy();
  });

  test("reports document and dom size gauges", () => {
    profiler.enable();
    const editor = createEditor(30);

    const gauges = profiler.report().gauges;
    expect(gauges["doc.topLevelBlocks"]).toBe(30);
    expect(gauges["dom.topLevelElements"]).toBe(30);
    expect(gauges["dom.placeholders"]).toBe(0);
    editor.destroy();
  });

  test("stops recording once the editor is destroyed", () => {
    const editor = createEditor(5);
    profiler.enable();
    editor.destroy();
    const before = profiler.report().counters["tx.count"] ?? 0;

    expect(profiler.report().counters["tx.count"] ?? 0).toBe(before);
  });
});
