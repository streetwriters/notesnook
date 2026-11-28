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

import type { BaseProps, DroppedFile } from "../../contracts/primitives";
import { setFocused, type DesktopElement } from "../element";
import {
  DesktopDataTransfer,
  dragEvent,
  focusEvent,
  isKeyPress,
  keyboardEvent,
  mouseEvent,
  pointerEvent,
  toUIFile,
  touchEvent,
  wheelEvent,
  type NativeEvent
} from "./events";

/** The parts of the platform the handlers need, passed in so this stays testable. */
export interface NativeHost {
  getPayload(): unknown;
  setPayload(payload: unknown): void;
  toFile(path: string, size: number): DroppedFile;
}

type Handler = (event: NativeEvent) => void;
type Props = BaseProps<any>;

// One drag runs at a time, so the data set in `onDragStart` is kept here until
// the next drag starts.
const dragData = new Map<string, string>();

function all(
  ...handlers: (Handler | undefined | false)[]
): Handler | undefined {
  const present = handlers.filter((handler): handler is Handler => !!handler);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return (event) => {
    for (const handler of present) handler(event);
  };
}

function droppedFiles(event: NativeEvent, host: NativeHost) {
  const files: { path: string; size: number }[] =
    event?.nativeEvent?.files ?? [];
  return files.map((file) => toUIFile(host.toFile(file.path, file.size)));
}

/** The `data-test-id` of an element. */
export function testIdOf(props: Props): string | undefined {
  const id = props["data-test-id"];
  return id === undefined || id === false ? undefined : String(id);
}

/**
 * The react-native-gpui props for everything in `BaseProps` that is not a
 * style and not a click: handlers that turn native events into DOM-shaped
 * ones, and the attributes. Undefined entries are left out.
 */
export function nativeEventProps(
  props: Props,
  host: NativeHost
): Record<string, unknown> {
  const focusable = !!(
    props.onFocus ||
    props.onBlur ||
    props.onKeyDown ||
    props.onKeyUp ||
    props.onKeyPress ||
    props.tabIndex !== undefined
  );
  const drag = (type: string, handler: ((event: any) => unknown) | undefined) =>
    handler &&
    ((event: NativeEvent) =>
      handler(
        dragEvent(
          type,
          event,
          new DesktopDataTransfer(dragData, droppedFiles(event, host))
        )
      ));
  const acceptsDrops = !!(
    props.onDrop ||
    props.onDragEnter ||
    props.onDragOver ||
    props.onDragLeave
  );

  const native: Record<string, unknown> = {
    testID: testIdOf(props),
    nativeID: props.id,
    tooltip: props.title || undefined,
    group: props.group,
    accessibilityLabel: props["aria-label"],
    accessibilityElementsHidden:
      props["aria-hidden"] === undefined
        ? undefined
        : props["aria-hidden"] === true || props["aria-hidden"] === "true",
    draggable: props.draggable || undefined,
    droppable: acceptsDrops || undefined,
    acceptsFiles: props.onDrop ? true : undefined,
    onDragStart: props.onDragStart
      ? (event: NativeEvent) => {
          dragData.clear();
          host.setPayload(
            props.onDragStart?.(
              dragEvent(
                "dragstart",
                event,
                new DesktopDataTransfer(dragData)
              )
            )
          );
        }
      : props.draggable
      ? () => {
          dragData.clear();
          host.setPayload(undefined);
        }
      : undefined,
    onDragEnd: drag("dragend", props.onDragEnd),
    onDragEnter: drag("dragenter", props.onDragEnter),
    onDragOver: drag("dragover", props.onDragOver),
    onDragLeave: drag("dragleave", props.onDragLeave),
    onDrop:
      props.onDrop ? drag("drop", props.onDrop) : undefined,
    onContextMenu:
      props.onContextMenu &&
      ((event: NativeEvent) =>
        props.onContextMenu?.(
          mouseEvent("contextmenu", event, {
            button: event?.nativeEvent?.button ?? 2
          })
        )),
    onPointerEnter: all(
      props.onMouseEnter &&
        ((event) => props.onMouseEnter?.(mouseEvent("mouseenter", event)))
    ),
    onPointerLeave: all(
      props.onMouseLeave &&
        ((event) => props.onMouseLeave?.(mouseEvent("mouseleave", event)))
    ),
    onPointerDown: all(
      props.onMouseDown &&
        ((event) => props.onMouseDown?.(mouseEvent("mousedown", event))),
      props.onPointerDown &&
        ((event) => props.onPointerDown?.(pointerEvent(event)))
    ),
    onPointerMove: all(
      props.onMouseMove &&
        ((event) => props.onMouseMove?.(mouseEvent("mousemove", event))),
      props.onPointerMove &&
        ((event) => props.onPointerMove?.(pointerEvent(event)))
    ),
    onPointerUp: all(
      props.onMouseUp &&
        ((event) => props.onMouseUp?.(mouseEvent("mouseup", event))),
      props.onPointerUp &&
        ((event) => props.onPointerUp?.(pointerEvent(event))),
      props.onAuxClick &&
        ((event) => {
          // As in the DOM, only buttons other than the primary one.
          if ((event?.nativeEvent?.button ?? 0) > 0)
            props.onAuxClick?.(mouseEvent("auxclick", event, { detail: 1 }));
        })
    ),
    onTouchStart:
      props.onTouchStart &&
      ((event: NativeEvent) =>
        props.onTouchStart?.(touchEvent("touchstart", event))),
    onTouchMove:
      props.onTouchMove &&
      ((event: NativeEvent) =>
        props.onTouchMove?.(touchEvent("touchmove", event))),
    onTouchEnd:
      props.onTouchEnd &&
      ((event: NativeEvent) =>
        props.onTouchEnd?.(touchEvent("touchend", event))),
    onWheel:
      props.onWheel &&
      ((event: NativeEvent) => props.onWheel?.(wheelEvent(event))),
    // Every focusable element reports its focus, for `document.activeElement`
    // and for a popup to give the focus back when it closes.
    onFocus: focusable
      ? (event: NativeEvent) => {
          const focus = focusEvent("focus", event);
          setFocused(focus.currentTarget as unknown as DesktopElement, true);
          props.onFocus?.(focus);
        }
      : undefined,
    onBlur: focusable
      ? (event: NativeEvent) => {
          const blur = focusEvent("blur", event);
          setFocused(blur.currentTarget as unknown as DesktopElement, false);
          props.onBlur?.(blur);
        }
      : undefined,
    onKeyDown: all(
      props.onKeyDown &&
        ((event) => props.onKeyDown?.(keyboardEvent("keydown", event))),
      props.onKeyPress &&
        ((event) => {
          if (isKeyPress((event?.nativeEvent ?? (event as any))?.key))
            props.onKeyPress?.(keyboardEvent("keypress", event));
        })
    ),
    onKeyUp:
      props.onKeyUp &&
      ((event: NativeEvent) => props.onKeyUp?.(keyboardEvent("keyup", event))),
    focusable: focusable ? true : undefined
  };
  for (const name in native)
    if (native[name] === undefined) delete native[name];
  return native;
}

export interface ClickState {
  last: number;
}

/**
 * The handler for a native press. It raises `onClick`, and `onDoubleClick` on the second press within 400 ms. `state`
 * has to outlive a render for a double click to be seen across one.
 */
export function pressHandler(
  props: Props,
  state: ClickState = { last: 0 },
  now: () => number = Date.now
) {
  if (!props.onClick && !props.onDoubleClick)
    return undefined;
  return (event: NativeEvent) => {
    const time = now();
    const isDouble = time - state.last < 400;
    state.last = isDouble ? 0 : time;
    const detail = isDouble ? 2 : 1;
    props.onClick?.(mouseEvent("click", event, { button: 0, detail }));
    if (isDouble)
      props.onDoubleClick?.(
        mouseEvent("dblclick", event, { button: 0, detail })
      );
  };
}
