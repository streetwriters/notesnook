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

import type {
  EditorHeading,
  EditorSelection,
  EditorStatistics
} from "../contracts/editor";

/**
 * Pure glue between `EditorSurfaceProps` and the native editor's query/command
 * protocol, kept free of React so it can be tested without a window.
 */

export const SELECTION_QUERY = "selection";
export const HISTORY_QUERY = "history";
export const STATISTICS_QUERY = "statistics";
export const HEADINGS_QUERY = "headings";

export const EDITOR_QUERIES = [
  { key: SELECTION_QUERY, kind: "selection" },
  { key: HISTORY_QUERY, kind: "history" },
  { key: STATISTICS_QUERY, kind: "statistics" },
  { key: HEADINGS_QUERY, kind: "headings" }
] as const;

export interface EditorSurfaceCallbacks {
  onSelectionChange?: (selection: EditorSelection) => void;
  onStatisticsChange?: (statistics: EditorStatistics) => void;
  onHeadingsChange?: (headings: EditorHeading[]) => void;
  onUndoRedoChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Applies the keys that changed in a query result. Returns the selection when
 * it changed, so the caller can keep it for `getSelection`.
 */
export function dispatchQueryResults(
  changed: Record<string, unknown>,
  callbacks: EditorSurfaceCallbacks
): EditorSelection | undefined {
  let selection: EditorSelection | undefined;
  const sel = changed[SELECTION_QUERY];
  if (
    isObject(sel) &&
    typeof sel.from === "number" &&
    typeof sel.to === "number"
  ) {
    selection = { from: sel.from, to: sel.to };
    callbacks.onSelectionChange?.(selection);
  }
  const history = changed[HISTORY_QUERY];
  if (isObject(history)) {
    callbacks.onUndoRedoChange?.({
      canUndo: !!history.canUndo,
      canRedo: !!history.canRedo
    });
  }
  const statistics = changed[STATISTICS_QUERY];
  if (isObject(statistics))
    callbacks.onStatisticsChange?.(statistics as unknown as EditorStatistics);
  const headings = changed[HEADINGS_QUERY];
  if (Array.isArray(headings)) {
    callbacks.onHeadingsChange?.(
      headings.map((h) => ({
        level: Number(h.level),
        title: String(h.title ?? ""),
        id: String(h.id)
      }))
    );
  }
  return selection;
}

/**
 * Decides what the editor should load when it (re)appears: content typed
 * while the surface was hidden or unmounted wins over the stored note.
 */
export function takeContent(
  unsaved: { current: string | undefined },
  source: () => string | undefined
): string {
  const value = unsaved.current ?? source() ?? "";
  unsaved.current = undefined;
  return value;
}
