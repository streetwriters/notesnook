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
  useCallback,
  useRef,
  useState,
  type ComponentType,
  type Ref
} from "react";
import type { DroppedFile, PressEvent } from "../contracts";
import { toThemeUISx } from "./sx";

/**
 * The one place the web kit still understands the kit's old React Native
 * style names. `legacy(Component)` renders theme-ui's own component and only
 * renames the deprecated props (`onPress`, `testID`, `onChangeText`, ...) to
 * the DOM ones theme-ui takes. Everything else, and every new-style prop, is
 * passed through untouched.
 *
 * Goes away with the deprecated names (plan item 5.1): each export in
 * `primitives.tsx` then becomes a plain re-export.
 */

type Props = Record<string, any>;

export interface LegacyOptions {
  /** Class the old layout defaults in `LEGACY_LAYOUT_CSS` hang on. */
  className?: string;
  /** What `onValueChange` receives. */
  value?: "string" | "number";
  /** Props the old kit set by default. */
  defaults?: Props;
}

/**
 * The layout defaults the old web kit gave its elements (every `Box` a
 * column flexbox, as in React Native). `:where()` keeps them at zero
 * specificity, so anything theme-ui generates from `sx` or a variant wins.
 * Only `LayoutRoot` (the desktop-native web target) injects them.
 */
export const LEGACY_LAYOUT_CSS = `
:where(.nn-box,.nn-flex){display:flex;flex-direction:column;position:relative;min-width:0;min-height:0;flex-shrink:1;align-items:stretch;align-content:flex-start}
:where(.nn-flex){flex-direction:row}
:where(.nn-text){display:block;margin:0;user-select:none;white-space:pre-wrap}
`;

let dragPayload: unknown;

/** What the element being dragged returned from its old-style `onDragStart`. */
export function getDragPayload() {
  return dragPayload;
}

function toPress(event: any): PressEvent {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  return {
    button:
      event.button === 2
        ? "secondary"
        : event.button === 1
        ? "auxiliary"
        : "primary",
    detail: event.detail,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pageX: event.pageX,
    pageY: event.pageY,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation()
  };
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

function withDragFields(event: any) {
  event.payload = dragPayload;
  event.x = event.clientX;
  event.y = event.clientY;
  return event;
}

function toDroppedFile(file: File): DroppedFile {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    uri: URL.createObjectURL(file),
    text: () => file.text(),
    bytes: async () => new Uint8Array(await file.arrayBuffer())
  };
}

function matchesAccept(file: File, accept: string[]) {
  if (!accept.length) return true;
  return accept.some((pattern) =>
    pattern.startsWith(".")
      ? file.name.toLowerCase().endsWith(pattern.toLowerCase())
      : pattern.endsWith("/*")
      ? file.type.startsWith(pattern.slice(0, -1))
      : file.type === pattern
  );
}

function chain(first: ((event: any) => void) | undefined, second: (event: any) => void) {
  if (!first) return second;
  return (event: any) => {
    first(event);
    second(event);
  };
}

const POINTER = ["onPointerDown", "onPointerMove", "onPointerUp"] as const;

export function legacy<C>(
  Component: ComponentType<any>,
  options: LegacyOptions = {}
): C {
  function Legacy(props: Props, ref: Ref<unknown>) {
    const [dragOver, setDragOver] = useState(false);
    const dragDepth = useRef(0);
    // Old call sites still measure through `measureInWindow`; the ref itself
    // is the real DOM element.
    const setRef = useCallback(
      (node: any) => {
        if (node && !node.measureInWindow)
          node.measureInWindow = (
            callback: (x: number, y: number, w: number, h: number) => void
          ) => {
            const rect = node.getBoundingClientRect();
            callback(rect.left, rect.top, rect.width, rect.height);
          };
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as { current: unknown }).current = node;
      },
      [ref]
    );

    const {
      testID,
      onPress,
      onHoverIn,
      onHoverOut,
      group,
      numberOfLines,
      resizeMode,
      selectable,
      focusable,
      onChangeText,
      onSubmitEditing,
      selectTextOnFocus,
      onCheckedChange,
      onValueChange,
      options: selectOptions,
      droppable,
      acceptsFiles,
      onDropFiles,
      ...rest
    } = props;
    const out: Props = { ...options.defaults, ...rest, ref: setRef };

    let sx = toThemeUISx(rest.sx);
    const addSx = (extra: Props) => (sx = { ...extra, ...sx });
    if (numberOfLines) sx = toThemeUISx({ lineClamp: numberOfLines, ...sx });
    if (resizeMode)
      addSx({ objectFit: resizeMode === "stretch" ? "fill" : resizeMode });
    if (selectable) addSx({ userSelect: "text" });
    if (sx !== undefined) out.sx = sx;

    const classes = [
      rest.className,
      options.className === "nn-box" && sx?.display === "flex"
        ? "nn-flex"
        : options.className,
      group ? `nn-group-${group}` : undefined
    ].filter(Boolean);
    if (classes.length) out.className = classes.join(" ");

    if (testID !== undefined && out["data-test-id"] === undefined)
      out["data-test-id"] = testID;
    if (onPress) {
      out.onClick = chain(rest.onClick, (event) => onPress(toPress(event)));
      out.onAuxClick = chain(rest.onAuxClick, (event) => {
        if (event.button === 1) onPress(toPress(event));
      });
    }
    if (onHoverIn) out.onMouseEnter = chain(rest.onMouseEnter, onHoverIn);
    if (onHoverOut) out.onMouseLeave = chain(rest.onMouseLeave, onHoverOut);
    for (const name of POINTER)
      if (rest[name]) out[name] = withOffset(rest[name]);
    if (focusable === false) {
      out.tabIndex = -1;
      out.onMouseDown = chain(rest.onMouseDown, (event) =>
        event.preventDefault()
      );
    }

    if (onChangeText)
      out.onChange = chain(rest.onChange, (event) =>
        onChangeText(event.target.value)
      );
    if (onCheckedChange)
      out.onChange = chain(rest.onChange, (event) =>
        onCheckedChange(event.target.checked)
      );
    if (onValueChange)
      out.onChange = chain(rest.onChange, (event) =>
        onValueChange(
          options.value === "number"
            ? Number(event.target.value)
            : event.target.value
        )
      );
    if (onSubmitEditing)
      out.onKeyDown = chain(rest.onKeyDown, (event) => {
        if (event.key === "Enter") onSubmitEditing(event.currentTarget.value);
      });
    if (selectTextOnFocus)
      out.onFocus = chain(
        (event) => event.currentTarget.select(),
        rest.onFocus ?? (() => {})
      );
    if (selectOptions)
      out.children = [
        rest.children,
        ...selectOptions.map((option: Props) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.title}
          </option>
        ))
      ];

    // Old-style drag and drop: `onDragStart` returns the payload and the
    // target reads it back from `event.payload`.
    if (rest.draggable && rest.onDragStart) {
      out.onDragStart = (event: any) => {
        dragPayload = rest.onDragStart(event);
        if (dragPayload !== undefined) {
          event.dataTransfer.setData("text/plain", "nn-drag");
          event.dataTransfer.effectAllowed = "move";
        }
      };
      out.onDragEnd = (event: any) => {
        event.dropped = event.dataTransfer.dropEffect !== "none";
        dragPayload = undefined;
        rest.onDragEnd?.(event);
      };
    }
    if (droppable || onDropFiles) {
      out["data-drag-over"] = dragOver ? "" : undefined;
      // dragenter/dragleave also fire for children: count them so enter and
      // leave are reported once per target.
      out.onDragEnter = (event: any) => {
        event.preventDefault();
        if (++dragDepth.current > 1) return;
        setDragOver(true);
        rest.onDragEnter?.(withDragFields(event));
      };
      out.onDragOver = (event: any) => {
        event.preventDefault();
        rest.onDragOver?.(withDragFields(event));
      };
      out.onDragLeave = (event: any) => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current > 0) return;
        setDragOver(false);
        rest.onDragLeave?.(withDragFields(event));
      };
      out.onDrop = (event: any) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragOver(false);
        const all = Array.from(event.dataTransfer.files as FileList);
        if (onDropFiles && all.length) {
          const files = all.filter((file) =>
            matchesAccept(file, acceptsFiles ?? [])
          );
          if (files.length) onDropFiles(files.map(toDroppedFile));
        } else rest.onDrop?.(withDragFields(event));
      };
    }

    return createElement(Component, out);
  }
  Legacy.displayName = Component.displayName ?? Component.name;
  return forwardRef(Legacy) as C;
}
