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
    view.dom.querySelectorAll("[data-page-placeholder]").length
  );
  recordLifetimes();

  // Chrome only, and coarse, but it is the same heap the document lives in.
  const memory = (
    performance as unknown as {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
    }
  ).memory;
  if (memory) {
    profiler.gauge(
      "memory.usedMB",
      Math.round(memory.usedJSHeapSize / 1048576)
    );
    profiler.gauge(
      "memory.totalMB",
      Math.round(memory.totalJSHeapSize / 1048576)
    );
  }
}

function afterPaint(callback: () => void): void {
  requestAnimationFrame(() => setTimeout(callback, 0));
}

/**
 * Times everything the state does with a transaction -- every plugin's `apply`
 * and every appended transaction -- so the work between dispatching and
 * rendering can be told apart from the handlers that run afterwards.
 *
 * Patched once and left in place: an editor that is torn down while another is
 * still running would otherwise take the timing away with it.
 */
let stateInstrumented = false;
function instrumentState(): void {
  if (stateInstrumented) return;
  stateInstrumented = true;

  const prototype = EditorState.prototype as unknown as {
    applyTransaction: (tr: Transaction) => unknown;
  };
  const original = prototype.applyTransaction;
  prototype.applyTransaction = function (tr: Transaction) {
    if (!profiler.enabled) return original.call(this, tr);
    return profiler.time("tx.stateApply", () => original.call(this, tr));
  };
}

function pluginName(plugin: Plugin): string {
  return String((plugin as unknown as { key?: string }).key ?? "plugin")
    .replace(/\$.*$/, "")
    .replace(/[^\w.-]/g, "");
}

/**
 * Times each plugin's state field `apply` under its own name.
 *
 * ProseMirror binds those functions when a state is built, so they have to be
 * wrapped before that happens -- wrapping them on a live view is too late, and
 * silently records nothing.
 */
let stateFieldsInstrumented = false;
export function instrumentPluginState(): void {
  if (stateFieldsInstrumented) return;
  stateFieldsInstrumented = true;

  const wrap = (plugins?: readonly Plugin[]) => {
    for (const plugin of plugins ?? []) {
      const spec = plugin.spec as {
        state?: { apply?: (...args: never[]) => unknown };
        profiledState?: boolean;
      };
      const apply = spec.state?.apply;
      if (!apply || !spec.state || spec.profiledState) continue;
      spec.profiledState = true;

      const name = pluginName(plugin);
      spec.state.apply = function (this: unknown, ...args: never[]) {
        if (!profiler.enabled) return apply.apply(this, args);
        return profiler.time(`plugin.apply.${name}`, () =>
          apply.apply(this, args)
        );
      };
    }
  };

  const create = EditorState.create;
  EditorState.create = function (config) {
    wrap(config.plugins);
    return create(config);
  } as typeof EditorState.create;

  const reconfigure = EditorState.prototype.reconfigure;
  EditorState.prototype.reconfigure = function (
    this: EditorState,
    config: Parameters<EditorState["reconfigure"]>[0]
  ) {
    wrap(config.plugins);
    return reconfigure.call(this, config);
  };
}

/**
 * Times each plugin's `appendTransaction` under its own name, so a slow
 * transaction says which plugin spent the time.
 */
function instrumentPlugins(view: EditorView): void {
  for (const plugin of view.state.plugins) {
    const name = pluginName(plugin);
    const spec = plugin.spec as {
      appendTransaction?: (...args: never[]) => unknown;
      profiled?: boolean;
    };
    if (spec.profiled) continue;
    spec.profiled = true;

    const append = spec.appendTransaction;
    if (append)
      spec.appendTransaction = function (this: unknown, ...args: never[]) {
        if (!profiler.enabled) return append.apply(this, args);
        return profiler.time(`plugin.append.${name}`, () =>
          append.apply(this, args)
        );
      };
  }
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

/**
 * Watches whether editors and views are actually freed once they are done with.
 *
 * Destroying one is not the same as freeing it: anything still holding a
 * reference -- a listener never removed, a store never cleared -- keeps it and
 * its whole document alive. A weak reference tells the truth on the spot, so
 * the count is right as soon as a collection has run rather than whenever the
 * browser gets round to a callback.
 */
type Watched = { ref: WeakRef<object>; done: boolean };

const watchedEditors: Watched[] = [];
const watchedViews: Watched[] = [];
// Extension instances can be shared between editors, so the entry is kept
// against the editor rather than in the extension's storage.
const watchByEditor = new WeakMap<object, Watched>();

function watch(list: Watched[], subject: object): Watched | undefined {
  if (typeof WeakRef === "undefined") return undefined;
  const entry = { ref: new WeakRef(subject), done: false };
  list.push(entry);
  return entry;
}

function countStillHeld(list: Watched[], name: string): void {
  let alive = 0;
  let held = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (!list[i].ref.deref()) {
      list.splice(i, 1);
      continue;
    }
    alive++;
    if (list[i].done) held++;
  }
  profiler.gauge(`editor.${name}Alive`, alive);
  profiler.gauge(`editor.${name}Leaked`, held);
}

function recordLifetimes(): void {
  countStillHeld(watchedEditors, "editors");
  countStillHeld(watchedViews, "views");
}

export function profilerPlugin(): Plugin {
  return new Plugin({
    key: profilerKey,
    view(view) {
      profiler.count("editor.viewsCreated");
      const watched = watch(watchedViews, view);
      const dispose = instrumentView(view);
      instrumentState();
      instrumentPlugins(view);
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
          profiler.count("editor.viewsDestroyed");
          if (watched) watched.done = true;
          dispose();
        }
      };
    }
  });
}

export const EditorProfiler = Extension.create({
  name: "profiler",

  onBeforeCreate() {
    instrumentPluginState();
  },

  // `this.editor` is only here, not in the plugin -- the element does not carry
  // it yet while the view is being built.
  onCreate() {
    profiler.count("editor.editorsCreated");
    const watched = watch(watchedEditors, this.editor);
    if (watched) watchByEditor.set(this.editor, watched);
  },

  onDestroy() {
    profiler.count("editor.editorsDestroyed");
    const watched = watchByEditor.get(this.editor);
    if (watched) watched.done = true;
  },

  addProseMirrorPlugins() {
    return [profilerPlugin()];
  }
});
