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

import { EditorState, PluginKey } from "@tiptap/pm/state";
import { DecorationSet, EditorView } from "@tiptap/pm/view";

export type ChildWindow = {
  /** Where the container itself begins and ends in the document. */
  containerStart: number;
  containerEnd: number;
  /** The half-open range of child indexes that is rendered. */
  from: number;
  to: number;
  /** The same run as document positions, for anything working in those. */
  renderedStart: number;
  renderedEnd: number;
  /** How many children it had, so an inserted one can be noticed. */
  childCount: number;
};

export type ViewportState = {
  visible: Set<string>;
  windows: Map<string, ChildWindow>;
  /** Set while printing, when every child of every container has to be there. */
  expanded: boolean;
  selectionIndex: number;
  pageCount: number;
  decorations: DecorationSet;
};

export const viewportKey = new PluginKey<ViewportState>("notesnook-paging");

/** Marks a container whose children are being windowed. */
export const WINDOWED_ATTRIBUTE = "data-windowed";

export function hasWindowedContainers(view: EditorView): boolean {
  return !!viewportKey.getState(view.state)?.windows.size;
}

export type RenderedRange = {
  containerStart: number;
  containerEnd: number;
  start: number;
  end: number;
};

/**
 * Every windowed container in the note, with the run of it that is actually
 * rendered. Anything that would otherwise walk all of a container's children
 * can use this to walk only the ones on screen: a child left out has no DOM of
 * its own, so work spent on it is wasted whatever the caller wanted it for.
 *
 * Read this from the state a transaction started in and move the positions
 * with its mapping. Reading it from the state being built depends on which
 * plugin's field is applied first, which is not something a caller should have
 * to know.
 */
export function renderedRanges(state: EditorState): RenderedRange[] {
  const windows = viewportKey.getState(state)?.windows;
  if (!windows?.size) return [];
  return [...windows.values()].map((window) => ({
    containerStart: window.containerStart,
    containerEnd: window.containerEnd,
    start: window.renderedStart,
    end: window.renderedEnd
  }));
}

export function isInsideWindowedContainer(
  view: EditorView,
  position: number
): boolean {
  const windows = viewportKey.getState(view.state)?.windows;
  if (!windows) return false;
  for (const window of windows.values())
    if (position > window.containerStart && position < window.containerEnd)
      return true;
  return false;
}
