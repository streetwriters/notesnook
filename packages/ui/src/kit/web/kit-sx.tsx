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

import {
  createElement,
  forwardRef,
  useRef,
  useState,
  type ComponentType,
  type Ref
} from "react";
import { toThemeUISx } from "./sx";

type Props = Record<string, any>;

/**
 * Renders theme-ui's own component. theme-ui takes every prop as it is, except
 * for what the kit adds on top of it:
 *
 * - the kit-only `sx` shapes, rewritten into the CSS theme-ui takes (`sx.ts`);
 * - the kit's own props that theme-ui has no name for: `group` (the class
 *   `:group-hover` selects on), `focusable`, `selectable`, `selectTextOnFocus`,
 *   the `x`/`y` of pointer events, the payload a `draggable` returns from
 *   `onDragStart` (for the drag ghost) and the `:drag-over` state of a drop
 *   target (`onDrop`);
 * - the defaults the kit has always set on these components.
 *
 * The deprecated React Native names are not understood here.
 */

export interface KitSxOptions {
  /** Class the layout defaults in `LAYOUT_DEFAULTS_CSS` hang on. */
  className?: string;
  /** Props the kit sets by default. */
  defaults?: Props;
  /** Styles the kit sets by default; `sx` overrides them. */
  sx?: Props;
}

/**
 * The layout defaults the kit draws (every `Box` a column flexbox, as in React
 * Native). `:where()` keeps them at zero specificity, so anything theme-ui
 * generates from `sx` or a variant wins. Only `LayoutRoot` (the desktop-native
 * web target) injects them.
 */
export const LAYOUT_DEFAULTS_CSS = `
:where(.nn-box,.nn-flex){display:flex;flex-direction:column;position:relative;min-width:0;min-height:0;flex-shrink:1;align-items:stretch;align-content:flex-start}
:where(.nn-flex){flex-direction:row}
:where(.nn-text){display:block;margin:0;user-select:none;white-space:pre-wrap}
:where(.nn-button){flex-direction:row;align-items:center;justify-content:center;flex-shrink:0}
:where(.nn-button):disabled{cursor:not-allowed}
:where(.nn-input)::placeholder{opacity:.6}
:where(.nn-textarea){resize:none;flex-shrink:0}
`;

let dragPayload: unknown;

/** What the element being dragged returned from its `onDragStart`. */
export function getDragPayload() {
  return dragPayload;
}

/** The contract's pointer events carry `x`/`y` relative to the element. */
function withOffset(handler: (event: any) => void) {
  return (event: any) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    event.x = event.clientX - rect.left;
    event.y = event.clientY - rect.top;
    handler(event);
  };
}

function chain(
  first: ((event: any) => void) | undefined,
  second: (event: any) => void
) {
  if (!first) return second;
  return (event: any) => {
    first(event);
    second(event);
  };
}

const POINTER = ["onPointerDown", "onPointerMove", "onPointerUp"] as const;

export function withKitSx<C>(
  Component: ComponentType<any>,
  options: KitSxOptions = {}
): C {
  function KitSx(props: Props, ref: Ref<unknown>) {
    const [dragOver, setDragOver] = useState(false);
    // dragenter/dragleave also fire for children: count them so enter and
    // leave are reported once per target.
    const dragDepth = useRef(0);
    const { group, selectable, focusable, selectTextOnFocus, ...rest } = props;
    const out: Props = { ...options.defaults, ...rest, ref };

    let sx = toThemeUISx(rest.sx);
    if (options.sx) sx = { ...options.sx, ...sx };
    if (selectable) sx = { userSelect: "text", ...sx };
    if (sx !== undefined) out.sx = sx;

    const classes = [
      rest.className,
      options.className === "nn-box" && sx?.display === "flex"
        ? "nn-flex"
        : options.className,
      group ? `nn-group-${group}` : undefined
    ].filter(Boolean);
    if (classes.length) out.className = classes.join(" ");

    if (focusable === false) {
      out.tabIndex = -1;
      out.onMouseDown = chain(rest.onMouseDown, (event) =>
        event.preventDefault()
      );
    }
    if (selectTextOnFocus)
      out.onFocus = chain(
        (event) => event.currentTarget.select(),
        rest.onFocus ?? (() => {})
      );
    for (const name of POINTER)
      if (rest[name]) out[name] = withOffset(rest[name]);

    // Old-style drag: `onDragStart` returns the payload for the drag ghost.
    if (rest.draggable && rest.onDragStart) {
      out.onDragStart = (event: any) => {
        dragPayload = rest.onDragStart(event);
        if (dragPayload !== undefined) {
          event.dataTransfer.setData("text/plain", "nn-drag");
          event.dataTransfer.effectAllowed = "move";
        }
      };
      out.onDragEnd = (event: any) => {
        dragPayload = undefined;
        rest.onDragEnd?.(event);
      };
    }

    // An element with `onDrop` is `:drag-over` while a drag is over it. It
    // accepts the drop unless its own `onDragOver` decides otherwise: as in the
    // DOM, a drop only fires when dragover is cancelled.
    if (rest.onDrop) {
      out["data-drag-over"] = dragOver ? "" : undefined;
      out.onDragEnter = (event: any) => {
        event.preventDefault();
        if (++dragDepth.current > 1) return;
        setDragOver(true);
        rest.onDragEnter?.(event);
      };
      out.onDragOver = (event: any) => {
        if (rest.onDragOver) rest.onDragOver(event);
        else event.preventDefault();
      };
      out.onDragLeave = (event: any) => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current > 0) return;
        setDragOver(false);
        rest.onDragLeave?.(event);
      };
      out.onDrop = (event: any) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragOver(false);
        rest.onDrop(event);
      };
    }

    return createElement(Component, out);
  }
  KitSx.displayName = Component.displayName ?? Component.name;
  return forwardRef(KitSx) as unknown as C;
}
