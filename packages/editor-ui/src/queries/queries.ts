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

import type { TextDirections } from "../extension-types.js";

export type SearchInfo = { count: number; selectedIndex: number };

export type QueryResults = {
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedNode: Record<string, any> | null;
  editable: boolean;
  textDirection: TextDirections;
  search: SearchInfo;
  can: boolean;
  selection: SelectionInfo;
  history: HistoryInfo;
  anchor: AnchorRect | null;
  focused: boolean;
  selectedText: string;
};

export type SelectionInfo = { from: number; to: number; empty: boolean };
export type HistoryInfo = { canUndo: boolean; canRedo: boolean };
/** Viewport coordinates, as returned by coordsAtPos. */
export type AnchorRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};
/**
 * What an anchor query measures: the selection, the selected node of a type,
 * or a range of the document (for popups that open on something other than
 * the selection, e.g. the link under the pointer).
 */
export type AnchorTarget =
  | "selection"
  | { node: string | readonly string[] }
  | { range: { from: number; to: number } };

export type QueryKind = keyof QueryResults;

export type Query<K extends QueryKind = QueryKind> = {
  readonly key: string;
  readonly kind: K;
  readonly args: readonly unknown[];
};

const interned = new Map<string, Query>();

function query<K extends QueryKind>(kind: K, ...args: unknown[]): Query<K> {
  const key = `${kind}:${JSON.stringify(args)}`;
  let existing = interned.get(key);
  if (!existing) interned.set(key, (existing = { key, kind, args }));
  return existing as Query<K>;
}

export const q = {
  isActive: (
    name: string | readonly string[],
    attributes?: Record<string, unknown>
  ) =>
    attributes ? query("isActive", name, attributes) : query("isActive", name),
  attributes: (type: string) => query("attributes", type),
  selectedNode: (type: string | readonly string[]) =>
    query("selectedNode", type),
  editable: () => query("editable"),
  textDirection: () => query("textDirection"),
  search: () => query("search"),
  can: (command: string, ...commandArgs: unknown[]) =>
    query("can", command, ...commandArgs),
  selection: () => query("selection"),
  history: () => query("history"),
  anchor: (target: AnchorTarget = "selection") => query("anchor", target),
  focused: () => query("focused"),
  selectedText: (mark?: string) =>
    mark ? query("selectedText", mark) : query("selectedText")
};
