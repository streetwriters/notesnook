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

import { Extension } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { profiler } from "../../utils/profiler.js";

export const profilerKey = new PluginKey("notesnook-profiler");

const GAUGE_INTERVAL_MS = 500;

function now(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function recordGauges(view: EditorView): void {
  const doc = view.state.doc;
  profiler.gauge("doc.topLevelBlocks", doc.childCount);
  profiler.gauge("doc.nodeSize", doc.nodeSize);

  const children = view.dom.children;
  profiler.gauge("dom.topLevelElements", children.length);
  profiler.gauge(
    "dom.totalElements",
    view.dom.getElementsByTagName("*").length
  );
  profiler.gauge(
    "dom.placeholders",
    view.dom.querySelectorAll("[data-virtual-placeholder]").length
  );
}

function afterPaint(callback: () => void): void {
  requestAnimationFrame(() => setTimeout(callback, 0));
}

function instrumentView(view: EditorView): () => void {
  const originalDispatch = view.dispatch.bind(view);
  const originalUpdateState = view.updateState.bind(view);

  let depth = 0;
  let domTime = 0;
  let keystroke: { time: number; key: string } | null = null;

  view.updateState = (state: EditorState) => {
    if (!profiler.enabled) return originalUpdateState(state);
    const start = now();
    originalUpdateState(state);
    const duration = now() - start;
    domTime += duration;
    profiler.record("render.updateState", duration);
  };

  view.dispatch = (tr: Transaction) => {
    if (!profiler.enabled) return originalDispatch(tr);
    if (depth > 0) {
      profiler.count("tx.nested");
      return originalDispatch(tr);
    }

    depth++;
    domTime = 0;
    const start = now();
    try {
      originalDispatch(tr);
    } finally {
      depth--;
    }
    const total = now() - start;

    profiler.count("tx.count");
    profiler.record("tx.dispatch", total);
    profiler.record("tx.stateAndPlugins", Math.max(0, total - domTime));
    if (tr.docChanged) {
      profiler.count("tx.docChanged");
      profiler.record("tx.dispatch.docChanged", total);
      profiler.count("tx.steps", tr.steps.length);
    } else {
      profiler.record("tx.dispatch.viewOnly", total);
    }
    if (tr.getMeta("preventUpdate")) profiler.count("tx.preventUpdate");

    if (keystroke) {
      const pending = keystroke;
      keystroke = null;
      profiler.record("keystroke.toDomUpdated", now() - pending.time);
      afterPaint(() =>
        profiler.record("keystroke.toPainted", now() - pending.time)
      );
    }
    return undefined;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!profiler.enabled) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    profiler.count("keystroke.count");
    if (keystroke) profiler.count("keystroke.withoutTransaction");
    keystroke = { time: now(), key: event.key };
  };

  const onBeforeInput = () => {
    if (!profiler.enabled || !keystroke) return;
    profiler.record("keystroke.toBeforeInput", now() - keystroke.time);
  };

  const onCompositionStart = () => profiler.count("keystroke.composition");

  view.dom.addEventListener("keydown", onKeyDown, true);
  view.dom.addEventListener("beforeinput", onBeforeInput, true);
  view.dom.addEventListener("compositionstart", onCompositionStart, true);

  let longTasks: PerformanceObserver | undefined;
  try {
    if (typeof PerformanceObserver !== "undefined") {
      longTasks = new PerformanceObserver((list) => {
        if (!profiler.enabled) return;
        for (const entry of list.getEntries())
          profiler.record("longTask", entry.duration);
      });
      longTasks.observe({ entryTypes: ["longtask"] });
    }
  } catch (e) {
    longTasks = undefined;
  }

  return () => {
    view.dom.removeEventListener("keydown", onKeyDown, true);
    view.dom.removeEventListener("beforeinput", onBeforeInput, true);
    view.dom.removeEventListener("compositionstart", onCompositionStart, true);
    longTasks?.disconnect();
  };
}

export function profilerPlugin(): Plugin {
  return new Plugin({
    key: profilerKey,
    view(view) {
      const dispose = instrumentView(view);
      let lastGauge = 0;
      recordGauges(view);

      return {
        update(updatedView) {
          if (!profiler.enabled) return;
          const time = now();
          if (time - lastGauge < GAUGE_INTERVAL_MS) return;
          lastGauge = time;
          recordGauges(updatedView);
        },
        destroy() {
          dispose();
        }
      };
    }
  });
}

export const EditorProfiler = Extension.create({
  name: "profiler",
  addProseMirrorPlugins() {
    return [profilerPlugin()];
  }
});
