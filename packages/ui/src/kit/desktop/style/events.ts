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

import type { UIElement } from "../../contracts/elements";
import type {
  UIClipboardEvent,
  UIChangeEvent,
  UIDataTransfer,
  UIDragEvent,
  UIFile,
  UIFocusEvent,
  UIKeyboardEvent,
  UIMouseEvent,
  UISyntheticEvent,
  UITouch,
  UITouchEvent,
  UIWheelEvent
} from "../../contracts/events";
import type { PointerMoveEvent } from "../../contracts/primitives";
import { DesktopElement, elementFor } from "../element";

/** An event as react-native-gpui delivers it. */
export interface NativeEvent {
  nativeEvent?: Record<string, any>;
  target?: unknown;
  currentTarget?: unknown;
  preventDefault?(): void;
  stopPropagation?(): void;
}

/** What every kit event carries beyond the contract, for the kit's own use. */
export interface EventState {
  readonly type: string;
  readonly defaultPrevented: boolean;
  isDefaultPrevented(): boolean;
  isPropagationStopped(): boolean;
}

export const lastPointer = { x: 320, y: 120 };

function rememberPointer(x: unknown, y: unknown) {
  if (typeof x === "number" && typeof y === "number") {
    lastPointer.x = x;
    lastPointer.y = y;
  }
}

const detached = new DesktopElement({});

function payloadOf(event: NativeEvent | undefined): Record<string, any> {
  return event?.nativeEvent ?? (event as Record<string, any>) ?? {};
}

function modifiers(native: Record<string, any>) {
  return {
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey
  };
}

/**
 * The members every event has. `element` is the element the handler is on,
 * for events the kit raises itself; otherwise it is read from the native
 * event.
 */
export function syntheticEvent<T = UIElement>(
  type: string,
  event?: NativeEvent,
  element?: DesktopElement | null
): UISyntheticEvent<T> & EventState {
  const currentTarget =
    element ??
    elementFor(event?.currentTarget) ??
    elementFor(event?.target) ??
    detached;
  const target = elementFor(event?.target) ?? currentTarget;
  let prevented = false;
  let stopped = false;
  return {
    type,
    target,
    currentTarget: currentTarget as unknown as T,
    get defaultPrevented() {
      return prevented;
    },
    isDefaultPrevented: () => prevented,
    isPropagationStopped: () => stopped,
    preventDefault() {
      prevented = true;
      event?.preventDefault?.();
    },
    stopPropagation() {
      stopped = true;
      event?.stopPropagation?.();
    }
  };
}

function withMembers<B extends object, M extends object>(
  base: B,
  members: M
): B & M {
  // Not a spread: `defaultPrevented` is a getter and has to stay one.
  return Object.defineProperties(
    base,
    Object.getOwnPropertyDescriptors(members)
  ) as B & M;
}

export interface MouseOverrides {
  button?: number;
  detail?: number;
}

export function mouseEvent<T = UIElement>(
  type: string,
  event?: NativeEvent,
  overrides: MouseOverrides = {},
  element?: DesktopElement | null
): UIMouseEvent<T> & EventState & { x: number; y: number } {
  const native = payloadOf(event);
  const pageX = native.pageX ?? native.clientX ?? native.x ?? 0;
  const pageY = native.pageY ?? native.clientY ?? native.y ?? 0;
  rememberPointer(pageX, pageY);
  const base = syntheticEvent<T>(type, event, element);
  const members = mouseMembers(native, overrides, pageX, pageY);
  return withMembers(base, {
    ...members,
    nativeEvent: {
      ...members,
      preventDefault: () => base.preventDefault(),
      stopPropagation: () => base.stopPropagation()
    }
  });
}

function mouseMembers(
  native: Record<string, any>,
  overrides: MouseOverrides,
  pageX: number,
  pageY: number
) {
  return {
    ...modifiers(native),
    button:
      overrides.button ??
      (typeof native.button === "number" && native.button >= 0
        ? native.button
        : 0),
    buttons: typeof native.buttons === "number" ? native.buttons : 0,
    detail:
      overrides.detail ??
      (typeof native.detail === "number" ? native.detail : 0),
    clientX: native.clientX ?? pageX,
    clientY: native.clientY ?? pageY,
    pageX,
    pageY,
    x: native.locationX ?? native.offsetX ?? 0,
    y: native.locationY ?? native.offsetY ?? 0
  };
}

export function keyboardEvent<T = UIElement>(
  type: string,
  event?: NativeEvent,
  element?: DesktopElement | null
): UIKeyboardEvent<T> & EventState {
  const native = payloadOf(event);
  const base = syntheticEvent<T>(type, event, element);
  const members = {
    ...modifiers(native),
    key: (native.key ?? "") as string,
    code: (native.code ?? "") as string,
    repeat: !!native.repeat
  };
  return withMembers(base, {
    ...members,
    nativeEvent: {
      ...members,
      keyCode: typeof native.keyCode === "number" ? native.keyCode : 0,
      preventDefault: () => base.preventDefault(),
      stopPropagation: () => base.stopPropagation()
    }
  });
}

/** `keypress` is raised for keys that type a character, and for Enter. */
export function isKeyPress(key: unknown) {
  return typeof key === "string" && (key.length === 1 || key === "Enter");
}

export function focusEvent<T = UIElement>(
  type: string,
  event?: NativeEvent,
  element?: DesktopElement | null
): UIFocusEvent<T> & EventState {
  const base = syntheticEvent<T>(type, event, element);
  return withMembers(base, {
    // Focus does not bubble on desktop: the handler's element is the target.
    target: base.currentTarget as object & T,
    relatedTarget: null
  });
}

export function wheelEvent<T = UIElement>(
  event?: NativeEvent,
  element?: DesktopElement | null
): UIWheelEvent<T> & EventState {
  const native = payloadOf(event);
  return withMembers(mouseEvent<T>("wheel", event, {}, element), {
    deltaX: native.deltaX ?? 0,
    deltaY: native.deltaY ?? 0,
    deltaZ: native.deltaZ ?? 0,
    deltaMode: native.deltaMode ?? 0
  });
}

function touches(list: unknown): UITouch[] {
  if (!Array.isArray(list)) return [];
  return list.map((touch: Record<string, any>) => ({
    identifier: touch.identifier ?? 0,
    clientX: touch.clientX ?? touch.pageX ?? 0,
    clientY: touch.clientY ?? touch.pageY ?? 0,
    pageX: touch.pageX ?? 0,
    pageY: touch.pageY ?? 0
  }));
}

export function touchEvent<T = UIElement>(
  type: string,
  event?: NativeEvent,
  element?: DesktopElement | null
): UITouchEvent<T> & EventState {
  const native = payloadOf(event);
  return withMembers(syntheticEvent<T>(type, event, element), {
    ...modifiers(native),
    touches: touches(native.touches),
    changedTouches: touches(native.changedTouches)
  });
}

export function changeEvent<T>(
  element: DesktopElement | null,
  event?: NativeEvent
): UIChangeEvent<T> & EventState {
  const base = syntheticEvent<T>("change", undefined, element ?? detached);
  return withMembers(base, {
    target: base.currentTarget as object & T,
    stopPropagation: () => event?.stopPropagation?.()
  });
}

/** A file as the native side reports it and as the kit's deprecated props take it. */
export interface NativeFile {
  name: string;
  size: number;
  type: string;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
}

export function toUIFile<F extends NativeFile>(file: F): F & UIFile {
  return Object.assign(file, {
    async arrayBuffer() {
      const bytes = await file.bytes();
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
    }
  });
}

/** The data of the drag in progress. A drag inside the app shares one store. */
export class DesktopDataTransfer implements UIDataTransfer {
  dropEffect = "none";
  effectAllowed = "all";

  constructor(
    private readonly store: Map<string, string>,
    readonly files: UIFile[] = []
  ) {}

  get types(): readonly string[] {
    const types = [...this.store.keys()];
    if (this.files.length > 0) types.push("Files");
    return types;
  }

  getData(format: string) {
    return this.store.get(normalizeFormat(format)) ?? "";
  }

  setData(format: string, data: string) {
    this.store.set(normalizeFormat(format), String(data));
  }

  clearData(format?: string) {
    if (format === undefined) this.store.clear();
    else this.store.delete(normalizeFormat(format));
  }
}

function normalizeFormat(format: string) {
  const lower = format.toLowerCase();
  return lower === "text" ? "text/plain" : lower;
}

export function dragEvent<T = UIElement>(
  type: string,
  event: NativeEvent | undefined,
  dataTransfer: UIDataTransfer,
  element?: DesktopElement | null
): UIDragEvent<T> & EventState {
  const native = payloadOf(event);
  return withMembers(mouseEvent<T>(type, event, {}, element), {
    dataTransfer
  });
}

/**
 * A paste into a text field. The native field reports the pasted text
 * (`nativeEvent.text`) and, when the clipboard holds files, those
 * (`nativeEvent.files`); `clipboardData.getData("text")` returns the text.
 * `preventDefault()` reaches the native event, which is how the field is told
 * not to insert the text itself.
 */
export function clipboardEvent<T = UIElement>(
  element: DesktopElement | null,
  event?: NativeEvent
): UIClipboardEvent<T> & EventState {
  const native = payloadOf(event) as { text?: unknown; files?: NativeFile[] };
  const store = new Map<string, string>();
  if (typeof native.text === "string") store.set("text/plain", native.text);
  const files = Array.isArray(native.files) ? native.files.map(toUIFile) : [];
  return withMembers(syntheticEvent<T>("paste", event, element ?? detached), {
    clipboardData: new DesktopDataTransfer(store, files)
  });
}

export function pointerEvent(event?: NativeEvent): PointerMoveEvent {
  const native = payloadOf(event);
  rememberPointer(native.pageX, native.pageY);
  return {
    x: native.locationX ?? native.offsetX ?? 0,
    y: native.locationY ?? native.offsetY ?? 0,
    pageX: native.pageX ?? 0,
    pageY: native.pageY ?? 0,
    buttons: native.buttons ?? 0
  };
}
