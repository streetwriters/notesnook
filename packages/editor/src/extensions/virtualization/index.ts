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

import { Editor, Extension } from "@tiptap/core";
import { HeightMap } from "./height-map.js";
import { withVirtualization } from "./node-views.js";
import { virtualizationPlugin } from "./viewport-plugin.js";

/** Paging only engages for notes larger than this many top-level blocks. */
const DEFAULT_THRESHOLD_BLOCKS = 300;

export type VirtualizationOptions = {
  enabled: boolean;
  thresholdBlocks: number;
};

export type VirtualizationStorage = {
  enabled: boolean;
  thresholdBlocks: number;
  heightMap: HeightMap;
};

/**
 * Renders only the top-level blocks near the viewport, keeping the rest in
 * editor state as content-less placeholders. This is the "hidden paging" from
 * docs/editor-performance — the only lever that reduces the browser layout/paint
 * cost of a very large document.
 *
 * High risk (breaks browser find-in-page and printing without the companion
 * work). Disabled by default; enable per-note above a size threshold.
 */
export const Virtualization = Extension.create<VirtualizationOptions>({
  name: "virtualization",

  addOptions() {
    return { enabled: false, thresholdBlocks: DEFAULT_THRESHOLD_BLOCKS };
  },

  addStorage(): VirtualizationStorage {
    return {
      enabled: this.options.enabled,
      thresholdBlocks: this.options.thresholdBlocks,
      heightMap: new HeightMap()
    };
  },

  // Runs immediately before the Editor constructor creates its first view, so
  // that view is already virtualized. Installing any later (e.g. from
  // useEditor's effect) means the whole document gets mounted unvirtualized
  // once, which is the exact cost virtualization exists to avoid.
  onBeforeCreate() {
    installVirtualization(this.editor);
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];
    return [virtualizationPlugin()];
  }
});

/**
 * Wraps the editor's node views with the virtualization layer.
 *
 * Called from the extension's own `onBeforeCreate`, which fires before the
 * Editor constructor's `createView()` — so the very first view is virtualized.
 *
 * A ProseMirror plugin cannot do this: prosemirror-view consults the view's own
 * `nodeViews` prop before any plugin (buildNodeViews is first-wins), and Tiptap
 * overwrites `editorProps.nodeViews` with `extensionManager.nodeViews` via
 * setProps right after construction. So we decorate the getter at its source.
 *
 * The patch lives on the extensionManager instance, which outlives individual
 * views, so later `createView()` calls pick it up without reinstalling.
 */
export function installVirtualization(editor: Editor): void {
  const storage = editor.storage.virtualization as
    | VirtualizationStorage
    | undefined;
  if (!storage?.enabled) return;

  const manager = editor.extensionManager as unknown as Record<
    string,
    unknown
  >;
  if (Object.prototype.hasOwnProperty.call(manager, "nodeViews")) return;

  const proto = Object.getPrototypeOf(editor.extensionManager);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "nodeViews");
  const originalGetter = descriptor?.get;
  if (!originalGetter) return;

  Object.defineProperty(editor.extensionManager, "nodeViews", {
    configurable: true,
    get() {
      return withVirtualization(
        originalGetter.call(this),
        storage.heightMap,
        storage.thresholdBlocks
      );
    }
  });
}

export { HeightMap } from "./height-map.js";
export { virtualizationKey } from "./viewport-plugin.js";
