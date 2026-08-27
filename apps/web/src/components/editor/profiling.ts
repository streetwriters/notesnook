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

import { Editor, getHTMLFromFragment, profiler } from "@notesnook/editor";

const TRACE_KEY = "nn:profiler:trace-scroll";

let activeEditor: Editor | undefined;

function isEditorScroller(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement && element.id.startsWith("editorScroll_")
  );
}

function stack(): string {
  const lines = (new Error().stack || "").split("\n").slice(3, 8);
  return lines.map((line) => line.trim()).join("\n    ");
}

/**
 * Logs every scroll of the editor's container and who caused it. Installed at
 * import time so it catches whatever happens while a note is opening.
 */
function traceScrolling() {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  if (proto.__nnScrollTraced) return;
  proto.__nnScrollTraced = true;

  const descriptor = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "scrollTop"
  );
  if (descriptor?.set && descriptor.get) {
    const { get, set } = descriptor;
    Object.defineProperty(Element.prototype, "scrollTop", {
      ...descriptor,
      set(this: Element, value: number) {
        if (isEditorScroller(this))
          console.log(
            `[scroll] scrollTop ${Math.round(
              get.call(this) as number
            )} -> ${Math.round(value)}\n    ${stack()}`
          );
        set.call(this, value);
      }
    });
  }

  for (const name of ["scrollBy", "scrollTo", "scrollIntoView"] as const) {
    const original = Element.prototype[name] as (...args: unknown[]) => void;
    Element.prototype[name] = function (this: Element, ...args: unknown[]) {
      if (isEditorScroller(this) || name === "scrollIntoView")
        console.log(
          `[scroll] ${name}(${JSON.stringify(args[0])})\n    ${stack()}`
        );
      return original.apply(this, args);
    } as typeof original;
  }
}

try {
  if (globalThis.localStorage?.getItem(TRACE_KEY) === "1") traceScrolling();
} catch (e) {
  /* storage unavailable */
}

export function setProfiledEditor(editor: Editor | undefined) {
  activeEditor = editor;
}

function requireEditor(): Editor | undefined {
  if (!activeEditor || activeEditor.isDestroyed) {
    console.warn("[profiler] no active editor. open a note first.");
    return undefined;
  }
  return activeEditor;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function afterPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => setTimeout(() => resolve(), 0))
  );
}

function findScrollParent(node: HTMLElement): HTMLElement | undefined {
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    )
      return current;
    current = current.parentElement;
  }
  return undefined;
}

function documentStats(editor: Editor) {
  const dom = editor.view.dom;
  return {
    topLevelBlocks: editor.state.doc.childCount,
    docNodeSize: editor.state.doc.nodeSize,
    characters: editor.state.doc.textContent.length,
    domTopLevelElements: dom.children.length,
    domTotalElements: dom.getElementsByTagName("*").length,
    placeholders: dom.querySelectorAll("[data-page-placeholder]").length,
    virtualization: !!(
      editor.storage.virtualization as { enabled?: boolean } | undefined
    )?.enabled
  };
}

async function typeTest(count = 200, delayMs = 0) {
  const editor = requireEditor();
  if (!editor) return;

  const dom = editor.view.dom as HTMLElement;
  editor.commands.focus();
  profiler.event("bench.type.start", { count });

  const start = performance.now();
  for (let i = 0; i < count; i++) {
    dom.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "a",
        bubbles: true,
        cancelable: true
      })
    );
    editor.view.dispatch(editor.state.tr.insertText("a"));
    await afterPaint();
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  const elapsed = performance.now() - start;

  profiler.event("bench.type.end", { count, elapsed });
  console.log(
    `[profiler] typed ${count} characters in ${Math.round(
      elapsed
    )}ms (${Math.round(elapsed / count)}ms/char incl. paint)`
  );
  return profiler.print(`type:${count}`);
}

async function scrollTest(steps = 40) {
  const editor = requireEditor();
  if (!editor) return;

  const container = findScrollParent(editor.view.dom);
  if (!container) {
    console.warn("[profiler] no scroll container found.");
    return;
  }

  const max = container.scrollHeight - container.clientHeight;
  const step = max / steps;
  profiler.event("bench.scroll.start", { steps, max });

  const frames: number[] = [];
  const start = performance.now();
  for (let i = 0; i <= steps; i++) {
    const stepStart = performance.now();
    container.scrollTop = step * i;
    await afterPaint();
    const duration = performance.now() - stepStart;
    frames.push(duration);
    profiler.record("bench.scrollStep", duration);
  }
  const elapsed = performance.now() - start;

  const slowest = Math.max(...frames);
  profiler.event("bench.scroll.end", { elapsed, slowest });
  console.log(
    `[profiler] scrolled ${steps} steps in ${Math.round(
      elapsed
    )}ms (slowest step ${Math.round(slowest)}ms)`
  );
  container.scrollTop = 0;
  await nextFrame();
  return profiler.print(`scroll:${steps}`);
}

function serializeTest(runs = 5) {
  const editor = requireEditor();
  if (!editor) return;

  for (let i = 0; i < runs; i++)
    profiler.time("bench.getHTML", () =>
      getHTMLFromFragment(editor.state.doc.content, editor.schema)
    );
  return profiler.print(`serialize:${runs}`);
}

export function installProfilerGlobals() {
  const api = {
    profiler,
    enable(options?: { timeline?: boolean }) {
      profiler.enable(options);
      console.log(
        "[profiler] enabled and persisted. reload to profile editor startup."
      );
      return api;
    },
    disable() {
      profiler.disable();
      console.log("[profiler] disabled.");
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
      const editor = requireEditor();
      if (!editor) return;
      const stats = documentStats(editor);
      console.table(stats);
      return stats;
    },
    copy(label?: string) {
      const json = JSON.stringify(profiler.report(label), null, 2);
      navigator.clipboard?.writeText(json);
      console.log("[profiler] report copied to clipboard.");
      return json;
    },
    typeTest,
    scrollTest,
    serializeTest,
    traceScroll(on = true) {
      try {
        if (on) globalThis.localStorage?.setItem(TRACE_KEY, "1");
        else globalThis.localStorage?.removeItem(TRACE_KEY);
      } catch (e) {
        /* storage unavailable */
      }
      console.log(
        on
          ? "[profiler] scroll tracing on. reload, then open the note."
          : "[profiler] scroll tracing off. reload to stop."
      );
    }
  };

  (globalThis as unknown as Record<string, unknown>).editorProfiler = api;
  if (profiler.enabled)
    console.log(
      "[profiler] active. window.editorProfiler.print() for a report, .disable() to turn off."
    );
  return api;
}
