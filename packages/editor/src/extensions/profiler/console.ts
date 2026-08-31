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

import { Editor } from "@tiptap/core";
import { profiler } from "../../utils/profiler.js";

/**
 * The commands the profiler is driven by from the browser console.
 *
 * The editor it works on is held weakly: this is the tool used to chase things
 * being kept alive, and it would be a poor one if it kept an editor alive
 * itself.
 */
let current: WeakRef<Editor> | undefined;

export function setProfiledEditor(editor: Editor): void {
  current = typeof WeakRef === "undefined" ? undefined : new WeakRef(editor);
  install();
}

function editorNow(): Editor | undefined {
  const editor = current?.deref();
  if (!editor || editor.isDestroyed) {
    console.warn("[profiler] no editor open.");
    return undefined;
  }
  return editor;
}

function documentStats(editor: Editor) {
  const dom = editor.view.dom;
  return {
    topLevelBlocks: editor.state.doc.childCount,
    docNodeSize: editor.state.doc.nodeSize,
    characters: editor.state.doc.textContent.length,
    domTopLevelElements: dom.children.length,
    domTotalElements: dom.getElementsByTagName("*").length,
    placeholders: dom.querySelectorAll("[data-page-placeholder]").length
  };
}

let installed = false;

function install(): void {
  if (installed || typeof globalThis === "undefined") return;
  installed = true;

  const api = {
    profiler,
    enable(options?: { timeline?: boolean }) {
      profiler.enable(options);
      console.log("[profiler] on. reload to profile the editor starting up.");
      return api;
    },
    disable() {
      profiler.disable();
      console.log("[profiler] off.");
      return api;
    },
    reset() {
      profiler.reset();
      return api;
    },
    report: (label?: string) => profiler.report(label),
    print: (label?: string) => profiler.print(label),
    snapshot: (label: string) => profiler.snapshot(label),
    compare: (baseline: string, candidate: string) =>
      profiler.compare(baseline, candidate),
    snapshots: () => profiler.listSnapshots(),
    stats() {
      const editor = editorNow();
      if (!editor) return;
      const stats = documentStats(editor);
      console.table(stats);
      return stats;
    },
    copy(label?: string) {
      const json = JSON.stringify(profiler.report(label), null, 2);
      navigator.clipboard?.writeText(json);
      console.log("[profiler] report copied.");
      return json;
    }
  };

  (globalThis as unknown as Record<string, unknown>).editorProfiler = api;
  if (profiler.enabled)
    console.log(
      "[profiler] active. editorProfiler.print() for a report, .copy() for the JSON."
    );
}
