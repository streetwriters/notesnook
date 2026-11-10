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
  Children,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from "react";
import { Dimensions, Text as NativeText } from "react-native";
import { DragDrop } from "@react-native-gpui/core/desktop";
import type {
  BaseProps,
  ContextMenuEvent,
  DragEvent,
  HoverEvent,
  PointerMoveEvent,
  KeyEvent,
  PressEvent,
  SxProp
} from "../../../../ui";
import { toPickedFile } from "../../platform/files";
import { useThemeContext } from "../theme";
import { breakpointOf, resolveSx, type ResolvedStyle } from "./resolve";

const TEXT_KEYS = [
  "color",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "textDecorationLine"
] as const;

type Style = Record<string, unknown>;

export const InheritedTextStyle = createContext<Style | undefined>(undefined);

const currentBreakpoints: string[] = ["480px", "1000px", "1000px"];
const listeners = new Set<() => void>();
let bucket = breakpointOf(Dimensions.get("window").width, currentBreakpoints);
Dimensions.addEventListener(
  "change",
  ({ window }: { window: { width: number } }) => {
    const next = breakpointOf(window.width, currentBreakpoints);
    if (next === bucket) return;
    bucket = next;
    listeners.forEach((listener) => listener());
  }
);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBreakpoint() {
  return useSyncExternalStore(subscribe, () => bucket);
}

const SHORTHAND_KEYS = [
  "m",
  "mt",
  "mr",
  "mb",
  "ml",
  "mx",
  "my",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginX",
  "marginY",
  "p",
  "pt",
  "pr",
  "pb",
  "pl",
  "px",
  "py",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingX",
  "paddingY",
  "gap",
  "rowGap",
  "columnGap",
  "color",
  "bg",
  "backgroundColor"
] as const;

function mergeShorthands(
  props: BaseProps,
  defaults?: SxProp
): SxProp | undefined {
  let merged: Record<string, unknown> | undefined;
  for (const key of SHORTHAND_KEYS) {
    const value = (props as Record<string, unknown>)[key];
    if (value === undefined) continue;
    (merged ??= {})[key] = value;
  }
  if (!merged && !defaults) return props.sx;
  return { ...defaults, ...merged, ...props.sx } as SxProp;
}

export interface StyledOptions {
  variantGroup?: "variants" | "text" | "buttons" | "forms";
  defaultVariant?: string;
  defaults?: SxProp;
}

export interface StyledResult {
  resolved: ResolvedStyle;
  viewStyle: Style;
  textStyle: Style | undefined;
  nativeProps: Record<string, unknown>;
}

export const lastPointer = { x: 320, y: 120 };

function rememberPointer(native: { pageX?: number; pageY?: number }) {
  if (typeof native.pageX === "number" && typeof native.pageY === "number") {
    lastPointer.x = native.pageX;
    lastPointer.y = native.pageY;
  }
}

function press(event: any): PressEvent {
  const native = event?.nativeEvent ?? {};
  rememberPointer(native);
  return {
    button: "primary",
    detail: 1,
    x: native.locationX ?? 0,
    y: native.locationY ?? 0,
    pageX: native.pageX ?? 0,
    pageY: native.pageY ?? 0,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {},
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

export function key(event: any): KeyEvent {
  const native = event?.nativeEvent ?? event ?? {};
  return {
    key: native.key,
    repeat: !!native.repeat,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {
      event?.preventDefault?.();
    },
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

function pointer(event: any): PointerMoveEvent {
  const native = event?.nativeEvent ?? event ?? {};
  rememberPointer(native);
  return {
    x: native.locationX ?? 0,
    y: native.locationY ?? 0,
    pageX: native.pageX ?? 0,
    pageY: native.pageY ?? 0,
    buttons: native.buttons ?? 0
  };
}

function hover(event: any): HoverEvent {
  const native = event?.nativeEvent ?? event ?? {};
  rememberPointer(native);
  return {
    pageX: native.pageX ?? 0,
    pageY: native.pageY ?? 0,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {},
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

function drag(event: any): DragEvent {
  const native = event?.nativeEvent ?? event ?? {};
  return {
    payload: DragDrop.getPayload(),
    x: native.x ?? 0,
    y: native.y ?? 0,
    pageX: native.pageX ?? 0,
    pageY: native.pageY ?? 0
  };
}

function contextMenu(event: any): ContextMenuEvent {
  const native = event?.nativeEvent ?? event ?? {};
  rememberPointer({
    pageX: native.pageX ?? native.x,
    pageY: native.pageY ?? native.y
  });
  return {
    pageX: native.pageX ?? native.x ?? 0,
    pageY: native.pageY ?? native.y ?? 0,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {
      event?.preventDefault?.();
    },
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

export function useStyled(
  props: BaseProps & { variant?: string },
  options: StyledOptions = {}
): StyledResult {
  const context = useThemeContext();
  const breakpoint = useBreakpoint();
  const sx = mergeShorthands(props, options.defaults);
  const resolved = resolveSx(sx, context, {
    variantGroup: options.variantGroup,
    variant: props.variant ?? options.defaultVariant,
    breakpoint
  });

  return useMemo(() => {
    const viewStyle: Style = { ...resolved.style };
    let textStyle: Style | undefined;
    for (const textKey of TEXT_KEYS) {
      if (viewStyle[textKey] === undefined) continue;
      (textStyle ??= {})[textKey] = viewStyle[textKey];
    }

    const nativeProps: Record<string, unknown> = {
      testID: props.testID,
      nativeID: props.id,
      tooltip: props.title || undefined,
      group: props.group,
      hoverStyle: resolved.hoverStyle,
      activeStyle: resolved.activeStyle,
      focusStyle: resolved.focusStyle,
      focusVisibleStyle: resolved.focusVisibleStyle,
      dragOverStyle: resolved.dragOverStyle,
      draggable: props.draggable || undefined,
      droppable: props.droppable || undefined,
      acceptsFiles: props.onDropFiles ? true : undefined,
      onDragStart: props.onDragStart
        ? () => DragDrop.setPayload(props.onDragStart?.())
        : props.draggable
        ? () => DragDrop.setPayload(undefined)
        : undefined,
      onDragEnd: props.onDragEnd
        ? (e: any) => props.onDragEnd?.({ dropped: !!e?.nativeEvent?.dropped })
        : undefined,
      onDragEnter: props.onDragEnter
        ? (e: unknown) => props.onDragEnter?.(drag(e))
        : undefined,
      onDragOver: props.onDragOver
        ? (e: unknown) => props.onDragOver?.(drag(e))
        : undefined,
      onDragLeave: props.onDragLeave
        ? (e: unknown) => props.onDragLeave?.(drag(e))
        : undefined,
      onDrop:
        props.onDrop || props.onDropFiles
          ? (e: any) => {
              const files: { path: string; size: number }[] =
                e?.nativeEvent?.files ?? [];
              if (files.length > 0 && props.onDropFiles) {
                const accepted = props.acceptsFiles?.map((extension) =>
                  extension.replace(/^\./, "").toLowerCase()
                );
                const picked = files
                  .filter(
                    (file) =>
                      !accepted ||
                      accepted.includes(
                        file.path.split(".").pop()?.toLowerCase() ?? ""
                      )
                  )
                  .map((file) => toPickedFile(file.path, file.size));
                if (picked.length > 0) props.onDropFiles(picked);
              } else props.onDrop?.(drag(e));
            }
          : undefined,
      groupHoverStyle: resolved.groupHoverStyle,
      groupActiveStyle: resolved.groupActiveStyle,
      onContextMenu: props.onContextMenu
        ? (e: unknown) => props.onContextMenu?.(contextMenu(e))
        : undefined,
      onPointerEnter: props.onHoverIn
        ? (e: unknown) => props.onHoverIn?.(hover(e))
        : undefined,
      onPointerLeave: props.onHoverOut
        ? (e: unknown) => props.onHoverOut?.(hover(e))
        : undefined,
      onPointerDown: props.onPointerDown
        ? (e: unknown) => props.onPointerDown?.(pointer(e))
        : undefined,
      onPointerMove: props.onPointerMove
        ? (e: unknown) => props.onPointerMove?.(pointer(e))
        : undefined,
      onPointerUp: props.onPointerUp
        ? (e: unknown) => props.onPointerUp?.(pointer(e))
        : undefined,
      onFocus: props.onFocus as never,
      onBlur: props.onBlur as never,
      onKeyDown: props.onKeyDown
        ? (e: unknown) => props.onKeyDown?.(key(e))
        : undefined,
      onKeyUp: props.onKeyUp
        ? (e: unknown) => props.onKeyUp?.(key(e))
        : undefined,
      focusable:
        props.onFocus ||
        props.onBlur ||
        props.onKeyDown ||
        props.onKeyUp ||
        resolved.focusStyle ||
        resolved.focusVisibleStyle
          ? true
          : undefined
    };
    for (const name in nativeProps)
      if (nativeProps[name] === undefined) delete nativeProps[name];
    return { resolved, viewStyle, textStyle, nativeProps };
  }, [resolved, props]);
}

export function pressHandler(props: BaseProps) {
  if (!props.onPress && !props.onDoubleClick) return undefined;
  let lastPress = 0;
  return (event: unknown) => {
    const now = Date.now();
    const pressEvent = press(event);
    const isDouble = now - lastPress < 400;
    lastPress = isDouble ? 0 : now;
    if (isDouble) pressEvent.detail = 2;
    props.onPress?.(pressEvent);
    if (isDouble) props.onDoubleClick?.(pressEvent);
  };
}

export function useMergedTextStyle(own: Style | undefined): Style | undefined {
  const inherited = useContext(InheritedTextStyle);
  return useMemo(
    () => (own ? { ...inherited, ...own } : inherited),
    [inherited, own]
  );
}

export function useInheritedTextStyle(): Style | undefined {
  return useContext(InheritedTextStyle);
}

export function wrapChildren(children: ReactNode, textStyle?: Style) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <NativeText style={textStyle as never}>{child}</NativeText>
    ) : (
      child
    )
  );
}
