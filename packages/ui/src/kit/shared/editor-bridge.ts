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
 * Notes with this many words or more are not saved automatically, as in the
 * web app (`MAX_AUTO_SAVEABLE_WORDS` in `apps/web/.../editor/types.ts`).
 */
export const MAX_AUTO_SAVEABLE_WORDS = 100_000;

/**
 * Follows the word count the editor reports. `update` returns true when the
 * note is too long to save automatically, which is when the surface calls
 * `onAutoSaveDisabled` and stops forwarding content changes.
 */
export function createAutoSaveGuard(limit = MAX_AUTO_SAVEABLE_WORDS) {
  let enabled = true;
  return {
    get enabled() {
      return enabled;
    },
    update(words: number | undefined): boolean {
      enabled = !words || words < limit;
      return !enabled;
    },
    /** A new note was loaded; its word count is not known yet. */
    reset() {
      enabled = true;
    }
  };
}

/** The word count in a `statistics` query result, if it holds one. */
export function wordCount(
  changed: Record<string, unknown>
): number | undefined {
  const statistics = changed[STATISTICS_QUERY];
  if (!isObject(statistics) || !isObject(statistics.words)) return undefined;
  const total = statistics.words.total;
  return typeof total === "number" ? total : undefined;
}

/**
 * What to run to put the caret where a note was left: the selection to
 * restore (if any) and where to focus. The native `focus` only gives the
 * view keyboard focus, so a restored selection is not undone by it.
 */
export function focusPlan(position: "start" | "end" | EditorSelection = "end") {
  if (typeof position === "object")
    return {
      commands: [
        {
          name: "setTextSelection",
          args: [{ from: position.from, to: position.to }]
        }
      ],
      selection: { from: position.from, to: position.to },
      focus: "end" as const
    };
  return { commands: [], selection: undefined, focus: position };
}

export interface HostActionTarget {
  host?: {
    previewAttachment?(a: { hash: string; type?: string }): unknown;
    downloadAttachment?(a: { hash: string }): unknown;
    openLink?(url: string, openInNewTab?: boolean): unknown;
    openAttachmentPicker?(type: "image" | "file" | "camera"): unknown;
    pasteFiles?(files: never[]): unknown;
  };
  onPreviewDocument?: (hash: string) => void;
  onAttachFiles?: (files: never[]) => void;
}

/**
 * Sends an action from the native editor to the host or the surface's
 * callbacks. Pasted or dropped files go to `onAttachFiles` (the app's attach
 * dialog, as on web) and only to the host's `pasteFiles` when the surface has
 * no such callback. Returns whether the action was handled.
 */
export function routeHostAction(
  action: { kind: string; payload: unknown },
  target: HostActionTarget
): boolean {
  const p = (action.payload ?? {}) as {
    hash?: string;
    url?: string;
    type?: string;
    files?: never[];
    openInNewTab?: boolean;
  };
  const host = target.host;
  switch (action.kind) {
    case "previewAttachment":
      if (!p.hash) return false;
      if (host?.previewAttachment)
        void host.previewAttachment({ hash: p.hash, type: p.type });
      else target.onPreviewDocument?.(p.hash);
      return true;
    case "downloadAttachment":
      if (!p.hash) return false;
      void host?.downloadAttachment?.({ hash: p.hash });
      return true;
    case "openLink":
      if (!p.url) return false;
      void host?.openLink?.(p.url, p.openInNewTab);
      return true;
    case "openAttachmentPicker":
      void host?.openAttachmentPicker?.(
        p.type === "file" || p.type === "camera" ? p.type : "image"
      );
      return true;
    case "pasteFiles":
      if (!p.files?.length) return false;
      if (target.onAttachFiles) target.onAttachFiles(p.files);
      else void host?.pasteFiles?.(p.files);
      return true;
    default:
      return false;
  }
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
