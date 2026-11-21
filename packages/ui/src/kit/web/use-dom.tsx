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
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref
} from "react";
import type {
  BaseProps,
  DroppedFile,
  KeyEvent,
  PressEvent,
  SxProp,
  UIElement
} from "../contracts";
import { resolveClassName, type ResolveOptions } from "./style/engine";
import { useThemeContext } from "./theme";
import { mergeShorthands } from "../shared/style/shorthand";

let dragPayload: unknown;

const WEB_TEST_IDS: Record<string, string> = {
  "editor-tags": "tags"
};

function webAttributes(testID: string | undefined) {
  if (testID === "menu-container") return { role: "menu" };
  if (testID === "list-item") return { tabIndex: -1 };
  if (testID === "virtual-list") return { "data-testid": "virtuoso-item-list" };
  if (testID?.startsWith("menu-button-"))
    return {
      role: "menuitem",
      tabIndex: -1,
      id: `menu-item-${testID.slice("menu-button-".length)}`
    };
  return undefined;
}

const MENU = '[data-test-id="menu-container"]';

export function isEscapeForOpenMenu(event: {
  key: string;
  target: EventTarget | null;
}) {
  return (
    event.key === "Escape" &&
    !!document.querySelector(MENU) &&
    !(event.target as HTMLElement).closest(MENU)
  );
}

// React attaches `wheel` listeners as passive, so `preventDefault()` from a
// React handler does nothing. Wheel handlers are registered here and invoked
// from one non-passive document listener, walking up from the event target.
const wheelHandlers = new Map<string, (event: WheelEvent) => void>();
let wheelCounter = 0;

function onDocumentWheel(event: WheelEvent) {
  let node = event.target instanceof Element ? event.target : null;
  while (node) {
    const id = node.getAttribute("data-nn-wheel");
    if (id) wheelHandlers.get(id)?.(event);
    node = node.parentElement;
  }
}

function addWheelHandler(id: string, handler: (event: WheelEvent) => void) {
  if (wheelHandlers.size === 0)
    document.addEventListener("wheel", onDocumentWheel, {
      passive: false,
      capture: true
    });
  wheelHandlers.set(id, handler);
  return () => {
    wheelHandlers.delete(id);
    if (wheelHandlers.size === 0)
      document.removeEventListener("wheel", onDocumentWheel, {
        capture: true
      });
  };
}

export function getDragPayload() {
  return dragPayload;
}

function modifiers(event: {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}) {
  return {
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    metaKey: event.metaKey
  };
}

function toPress(event: ReactMouseEvent): PressEvent {
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
    ...modifiers(event),
    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation()
  };
}

function toKey(event: ReactKeyboardEvent): KeyEvent {
  return {
    key: event.key,
    repeat: event.repeat,
    ...modifiers(event),
    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation()
  };
}

function toPointer(event: ReactPointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pageX: event.pageX,
    pageY: event.pageY,
    buttons: event.buttons
  };
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

export function useUIElement(
  ref: Ref<UIElement> | undefined,
  element: React.RefObject<HTMLElement | null>
) {
  useImperativeHandle(
    ref,
    () => ({
      focus: () => element.current?.focus(),
      blur: () => element.current?.blur(),
      measureInWindow: (callback) => {
        const rect = element.current?.getBoundingClientRect();
        if (rect) callback(rect.left, rect.top, rect.width, rect.height);
      }
    }),
    [element]
  );
}

export interface DomOptions {
  variantGroup?: ResolveOptions["variantGroup"];
  variant?: string;
  baseClass?: string;
  defaults?: SxProp;
  pressable?: boolean;
}

export function useDom(props: BaseProps & Record<string, any>, options: DomOptions) {
  const context = useThemeContext();
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);
  const [wheelId] = useState(() => `w${++wheelCounter}`);
  const onWheel = props.onWheel;
  const hasWheel = !!onWheel;
  const latestWheel = useRef(onWheel);
  latestWheel.current = onWheel;
  useEffect(() => {
    if (!hasWheel) return;
    return addWheelHandler(wheelId, (event) =>
      latestWheel.current?.({
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        preventDefault: () => event.preventDefault()
      })
    );
  }, [hasWheel, wheelId]);
  const sx = useMemoSx(props, options.defaults);
  const generated = resolveClassName(sx, context, {
    variantGroup: options.variantGroup,
    variant: options.variant
  });
  const className = [
    options.baseClass,
    generated,
    props.group ? `nn-group-${props.group}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  const accept = props.acceptsFiles;
  const hasDrop = props.droppable || !!props.onDropFiles;

  const dom: Record<string, unknown> = {
    className,
    id:
      props.id ??
      (props.testID?.startsWith("route-")
        ? props.testID.slice("route-".length)
        : undefined),
    title: props.title,
    "data-test-id":
      props.testID && WEB_TEST_IDS[props.testID]
        ? WEB_TEST_IDS[props.testID]
        : props.testID,
    ...webAttributes(props.testID),
    "data-drag-over": dragOver ? "" : undefined
  };

  if (props.onPress) {
    dom.onClick = (event: ReactMouseEvent) => props.onPress!(toPress(event));
    dom.onAuxClick = (event: ReactMouseEvent) => {
      if (event.button === 1) props.onPress!(toPress(event));
    };
  }
  if (props.onDoubleClick)
    dom.onDoubleClick = (event: ReactMouseEvent) =>
      props.onDoubleClick!(toPress(event));
  if (props.onContextMenu)
    dom.onContextMenu = (event: ReactMouseEvent) =>
      props.onContextMenu!({
        pageX: event.pageX,
        pageY: event.pageY,
        ...modifiers(event),
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      });
  if (props.onHoverIn)
    dom.onMouseEnter = (event: ReactMouseEvent) =>
      props.onHoverIn!({
        pageX: event.pageX,
        pageY: event.pageY,
        ...modifiers(event),
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      });
  if (props.onHoverOut)
    dom.onMouseLeave = (event: ReactMouseEvent) =>
      props.onHoverOut!({
        pageX: event.pageX,
        pageY: event.pageY,
        ...modifiers(event),
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      });
  if (props.onWheel) dom["data-nn-wheel"] = wheelId;
  if (props.onPointerDown)
    dom.onPointerDown = (event: ReactPointerEvent) =>
      props.onPointerDown!(toPointer(event));
  if (props.onPointerMove)
    dom.onPointerMove = (event: ReactPointerEvent) =>
      props.onPointerMove!(toPointer(event));
  if (props.onPointerUp)
    dom.onPointerUp = (event: ReactPointerEvent) =>
      props.onPointerUp!(toPointer(event));
  if (props.onFocus)
    dom.onFocus = (event: React.FocusEvent) =>
      props.onFocus!({
        relatedTarget: event.relatedTarget,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      });
  if (props.onBlur)
    dom.onBlur = (event: React.FocusEvent) =>
      props.onBlur!({
        relatedTarget: event.relatedTarget,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      });
  if (props.onKeyDown)
    dom.onKeyDown = (event: ReactKeyboardEvent) => {
      if (isEscapeForOpenMenu(event)) return;
      props.onKeyDown!(toKey(event));
    };
  if (props.onKeyUp)
    dom.onKeyUp = (event: ReactKeyboardEvent) => props.onKeyUp!(toKey(event));

  if (props.draggable) {
    dom.draggable = true;
    dom.onDragStart = (event: ReactDragEvent) => {
      dragPayload = props.onDragStart?.();
      event.dataTransfer.setData("text/plain", "nn-drag");
      event.dataTransfer.effectAllowed = "move";
    };
    dom.onDragEnd = (event: ReactDragEvent) => {
      const dropped = event.dataTransfer.dropEffect !== "none";
      dragPayload = undefined;
      props.onDragEnd?.({ dropped });
    };
  }
  if (hasDrop) {
    const dragEvent = (event: ReactDragEvent) => ({
      payload: dragPayload,
      x: event.clientX,
      y: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    });
    // dragenter/dragleave also fire for children: count them so enter and
    // leave are reported once per target, as on native.
    dom.onDragEnter = (event: ReactDragEvent) => {
      event.preventDefault();
      dragDepth.current++;
      if (dragDepth.current > 1) return;
      setDragOver(true);
      props.onDragEnter?.(dragEvent(event));
    };
    dom.onDragOver = (event: ReactDragEvent) => {
      event.preventDefault();
      props.onDragOver?.(dragEvent(event));
    };
    dom.onDragLeave = (event: ReactDragEvent) => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current > 0) return;
      setDragOver(false);
      props.onDragLeave?.(dragEvent(event));
    };
    dom.onDrop = (event: ReactDragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragOver(false);
      const all = Array.from(event.dataTransfer.files);
      const files = all.filter((file) => matchesAccept(file, accept ?? []));
      if (props.onDropFiles && all.length) {
        // A file drop never reaches onDrop; rejected files are ignored.
        if (files.length) props.onDropFiles(files.map(toDroppedFile));
      } else props.onDrop?.(dragEvent(event));
    };
  }
  return dom;
}

function useMemoSx(props: Record<string, any>, defaults?: SxProp): SxProp {
  const cached = useRef<{ key: string; value: SxProp } | undefined>(undefined);
  const merged = mergeShorthands(props as BaseProps, defaults);
  if (merged === props.sx) return merged ?? {};
  const key = JSON.stringify(merged);
  if (cached.current?.key === key) return cached.current.value;
  cached.current = { key, value: merged as SxProp };
  return cached.current.value;
}
