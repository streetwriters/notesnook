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

export type VirtualizationOptions = {
  enabled: boolean;
};

export type VirtualizationStorage = {
  enabled: boolean;
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
    return { enabled: false };
  },

  addStorage(): VirtualizationStorage {
    return {
      enabled: this.options.enabled,
      heightMap: new HeightMap()
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];
    return [virtualizationPlugin()];
  }
});

/**
 * Wraps the editor's node views with the virtualization layer. Must run before
 * the view is (re)created. A ProseMirror plugin cannot do this — prosemirror-view
 * consults the view's own `nodeViews` prop before any plugin (buildNodeViews is
 * first-wins) — so we decorate `extensionManager.nodeViews` at its source.
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
  // already installed on this instance
  if (Object.prototype.hasOwnProperty.call(manager, "nodeViews")) return;

  const proto = Object.getPrototypeOf(editor.extensionManager);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "nodeViews");
  const originalGetter = descriptor?.get;
  if (!originalGetter) return;

  Object.defineProperty(editor.extensionManager, "nodeViews", {
    configurable: true,
    get() {
      return withVirtualization(originalGetter.call(this), storage.heightMap);
    }
  });
}

export { HeightMap } from "./height-map.js";
export { virtualizationKey } from "./viewport-plugin.js";
